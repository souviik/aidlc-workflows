"""Kiro CLI adapter — drives AIDLC workflows via kiro-cli subprocess.

Uses ``kiro-cli chat`` with ``--no-interactive`` and ``--trust-all-tools``
flags for fully headless execution.

## v2 agentic execution (default when kiro_dist_path is set)

When ``AdapterConfig.kiro_dist_path`` points to the ``.kiro/`` distribution
directory (e.g. ``dist/kiro/.kiro``), the adapter:

1. Copies the entire ``.kiro/`` tree into the workspace root so Kiro picks up
   skills, agents, hooks, and protocols natively.
2. Sends ``/skill aidlc-orchestrator\\n<vision content>`` as the initial prompt,
   activating the v2 orchestrator skill.
3. Detects completion by checking for an ``intent-*/state/intent-state.md`` file
   containing ``status: complete``.

The process-check-hook.json in ``.kiro/hooks/`` fires automatically after every
``invokeSubAgent`` call, enforcing ``process_checker.js`` without any evaluator
intervention.

## v1 legacy execution (when kiro_dist_path is not set)

Falls back to the original steering-file mechanism: concatenates all rule
``.md`` files into ``.kiro/steering/aidlc-rules.md`` and sends a monolithic
AIDLC executor prompt.
"""

from __future__ import annotations

import logging
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

from cli_harness.adapter import AdapterConfig, AdapterResult, CLIAdapter
from cli_harness.normalizer import normalize_output
from cli_harness.prompt_template import render_prompt, render_v2_prompt

logger = logging.getLogger(__name__)

_KIRO_CLI = "kiro-cli"

# Matches ANSI escape sequences: CSI sequences (\x1b[...X), OSC sequences (\x1b]...\x07),
# and simple two-byte escapes (\x1b followed by one char).
_ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]|\x1b\][^\x07]*\x07|\x1b.")


def _strip_ansi(text: str) -> str:
    """Remove ANSI escape sequences from text."""
    return _ANSI_RE.sub("", text)


def _log(msg: str) -> None:
    """Print a progress message to stderr."""
    print(f"  [kiro-cli] {msg}", file=sys.stderr, flush=True)


def _find_aidlc_docs(workspace: Path) -> Path | None:
    """Find the aidlc-docs/ directory anywhere under workspace.

    Checks workspace/aidlc-docs/ first (v1), then searches one level deep
    for <subdir>/aidlc-docs/ (covers v2's org-ai-kb/aidlc-docs/ layout).
    Returns the first match, or None if not found.
    """
    direct = workspace / "aidlc-docs"
    if direct.is_dir():
        return direct
    for child in sorted(workspace.iterdir()):
        if child.is_dir() and not child.name.startswith("."):
            candidate = child / "aidlc-docs"
            if candidate.is_dir():
                return candidate
    return None


class KiroCLIAdapter(CLIAdapter):
    """Adapter for kiro-cli.

    Uses ``kiro-cli chat --no-interactive --trust-all-tools`` for headless
    execution via subprocess.
    """

    def __init__(self, verbose: bool = False):
        self.verbose = verbose

    @property
    def name(self) -> str:
        return "kiro-cli"

    def check_prerequisites(self) -> tuple[bool, str]:
        """Verify that ``kiro-cli`` is on PATH."""
        if not shutil.which(_KIRO_CLI):
            return False, (
                f"'{_KIRO_CLI}' not found in PATH. "
                "Install the Kiro CLI first (https://kiro.dev)."
            )
        return True, f"Kiro CLI ('{_KIRO_CLI}') found"

    def run(self, config: AdapterConfig) -> AdapterResult:
        """Execute the full AIDLC workflow through kiro-cli.

        Runs directly in ``<output_dir>/workspace/`` — no temp dir or copy step.
        """
        ok, msg = self.check_prerequisites()
        if not ok:
            return AdapterResult(
                success=False,
                output_dir=config.output_dir,
                error=f"Prerequisites not met: {msg}",
            )

        start_time = time.monotonic()

        # Work directly in the final output location
        config.output_dir.mkdir(parents=True, exist_ok=True)
        workspace = config.output_dir / "workspace"
        workspace.mkdir(exist_ok=True)
        _log(f"Workspace: {workspace}")

        try:
            # Copy input documents
            shutil.copy2(config.vision_path, workspace / "vision.md")
            _log(f"Copied vision: {config.vision_path}")
            if config.tech_env_path and config.tech_env_path.is_file():
                shutil.copy2(config.tech_env_path, workspace / "tech-env.md")
                _log(f"Copied tech-env: {config.tech_env_path}")

            is_v2 = config.kiro_dist_path is not None and config.kiro_dist_path.is_dir()

            if is_v2:
                # v2: copy the full .kiro/ distribution so Kiro picks up skills,
                # agents, hooks, and protocol files natively.
                kiro_dest = workspace / ".kiro"
                if kiro_dest.exists():
                    shutil.rmtree(kiro_dest)
                shutil.copytree(config.kiro_dist_path, kiro_dest)
                _log(f"Installed .kiro/ distribution from {config.kiro_dist_path}")

                # Build v2 prompt: /skill aidlc-orchestrator + vision content
                vision_content = config.vision_path.read_text(encoding="utf-8")
                prompt = config.prompt_template or render_v2_prompt(vision_content)
                _log("Using v2 agentic execution (/skill aidlc-orchestrator)")
            else:
                # v1 legacy: inject rules as a single steering file
                steering_dir = workspace / ".kiro" / "steering"
                steering_dir.mkdir(parents=True, exist_ok=True)

                rules_path = config.rules_path
                if rules_path.is_dir():
                    parts = []
                    for rule_file in sorted(rules_path.rglob("*.md")):
                        parts.append(rule_file.read_text(encoding="utf-8"))
                    rules_content = "\n\n".join(parts)
                else:
                    rules_content = rules_path.read_text(encoding="utf-8")

                (steering_dir / "aidlc-rules.md").write_text(
                    rules_content, encoding="utf-8"
                )
                _log(f"Injected AIDLC rules ({len(rules_content)} chars) via steering file")
                prompt = config.prompt_template or render_prompt()
                _log("Using v1 legacy execution (steering file)")

            # Base command flags
            base_flags = [
                "--no-interactive",
                "--trust-all-tools",
            ]
            if config.model:
                base_flags += ["--model", config.model]

            # Run kiro-cli in a loop to handle AIDLC review gates.
            # The workflow pauses at gates (e.g. "Approve & Continue").
            # With --no-interactive, kiro-cli exits at each gate.
            # We resume the session with an approval message each time.
            log_path = config.output_dir / "kiro-session.log"
            _log(f"Session log: {log_path}")

            turn = 0
            max_turns = 20  # safety limit
            total_rc = 0

            with open(log_path, "w", encoding="utf-8") as log_file:
                while turn < max_turns:
                    turn += 1

                    if turn == 1:
                        cmd = [_KIRO_CLI, "chat"] + base_flags + [prompt]
                        _log(f"Turn {turn}: initial prompt ({len(prompt)} chars)")
                    else:
                        approval = "Approve & Continue. Proceed to the next phase."
                        cmd = [_KIRO_CLI, "chat"] + base_flags + ["--resume", approval]
                        _log(f"Turn {turn}: resuming with approval")

                    log_file.write(f"\n{'='*60}\n")
                    log_file.write(f"TURN {turn}\n")
                    log_file.write(f"{'='*60}\n")
                    log_file.flush()

                    # nosec B603 - Executing user's Kiro CLI with validated configuration
                    # nosemgrep: dangerous-subprocess-use-audit
                    process = subprocess.Popen(
                        cmd,
                        cwd=str(workspace),
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        text=True,
                        bufsize=1,
                    )

                    for line in process.stdout:
                        log_file.write(_strip_ansi(line))
                        log_file.flush()
                        if self.verbose:
                            sys.stderr.write(line)
                            sys.stderr.flush()

                    remaining = config.timeout_seconds - (time.monotonic() - start_time)
                    if remaining <= 0:
                        process.kill()
                        _log(f"Timeout reached at turn {turn}")
                        break
                    process.wait(timeout=max(remaining, 10))
                    total_rc = process.returncode

                    _log(f"Turn {turn} exited with code {process.returncode}")

                    # Check completion — search for aidlc-docs/ anywhere under workspace
                    # (v2 places it at org-ai-kb/aidlc-docs/, v1 at aidlc-docs/)
                    aidlc_docs_dir = _find_aidlc_docs(workspace)
                    if aidlc_docs_dir is not None:
                        file_count = sum(1 for _ in aidlc_docs_dir.rglob("*") if _.is_file())

                        if is_v2:
                            complete = False
                            for state_file in aidlc_docs_dir.rglob("intent-state.md"):
                                content = state_file.read_text(encoding="utf-8")
                                # Match only the top-level "status: complete" header field,
                                # not individual skill rows which also contain "complete".
                                for line in content.splitlines():
                                    stripped = line.strip()
                                    if stripped.startswith("status:") and "complete" in stripped.lower():
                                        complete = True
                                        break
                                if complete:
                                    break
                            _log(f"  aidlc-docs: {file_count} files, intent-state={'complete' if complete else 'in-progress'}")
                            if complete:
                                _log("intent-state.md shows complete — workflow done")
                                break
                        else:
                            has_construction = (
                                any((aidlc_docs_dir / "construction").rglob("*.md"))
                                if (aidlc_docs_dir / "construction").is_dir() else False
                            )
                            _log(f"  aidlc-docs: {file_count} files, construction={'yes' if has_construction else 'no'}")
                            if has_construction:
                                _log("Construction phase detected — workflow complete")
                                break
                    else:
                        _log("  aidlc-docs/ not yet created")

                    elapsed = time.monotonic() - start_time
                    if elapsed >= config.timeout_seconds:
                        _log("Timeout reached")
                        break

            elapsed_seconds = time.monotonic() - start_time
            _log(f"Completed {turn} turn(s) in {elapsed_seconds:.0f}s")

            # List workspace contents for debugging
            _log("Workspace contents:")
            for item in sorted(workspace.iterdir()):
                _log(f"  {item.name}/") if item.is_dir() else _log(f"  {item.name}")

            # Move aidlc-docs to output_dir/ — search anywhere under workspace
            # (v2 places it at org-ai-kb/aidlc-docs/, v1 at aidlc-docs/)
            src_docs = _find_aidlc_docs(workspace)
            dst_docs = config.output_dir / "aidlc-docs"
            if src_docs is not None:
                if dst_docs.exists():
                    shutil.rmtree(dst_docs)
                shutil.move(str(src_docs), str(dst_docs))

            # Write run-meta.yaml and run-metrics.yaml
            # Kiro CLI does not expose token usage; pass turn count
            # so downstream reports show "data unavailable" rather than
            # silently reporting zeros that look like infinite efficiency.
            normalize_output(
                source_dir=workspace,
                output_dir=config.output_dir,
                adapter_name=self.name,
                elapsed_seconds=elapsed_seconds,
                token_usage={
                    "num_turns": turn,
                    "model": config.model or "",
                },
            )

            has_docs = dst_docs.is_dir() and any(dst_docs.iterdir())

            if total_rc == 0 and has_docs:
                return AdapterResult(
                    success=True,
                    output_dir=config.output_dir,
                    aidlc_docs_dir=dst_docs,
                    workspace_dir=workspace,
                    elapsed_seconds=elapsed_seconds,
                )

            error_detail = (
                f"kiro-cli completed {turn} turn(s), "
                "no aidlc-docs/ output was produced."
                if not has_docs
                else f"kiro-cli completed {turn} turn(s) "
                "but aidlc-docs/ may be incomplete."
            )
            return AdapterResult(
                success=has_docs,
                output_dir=config.output_dir,
                aidlc_docs_dir=dst_docs if has_docs else None,
                workspace_dir=workspace,
                error=error_detail if not has_docs else None,
                elapsed_seconds=elapsed_seconds,
            )

        except subprocess.TimeoutExpired:
            elapsed_seconds = time.monotonic() - start_time
            process.kill()
            _log(f"Timeout after {elapsed_seconds:.0f}s — killed process")
            return AdapterResult(
                success=False,
                output_dir=config.output_dir,
                workspace_dir=workspace,
                error=f"kiro-cli timed out after {config.timeout_seconds}s",
                elapsed_seconds=elapsed_seconds,
            )

        except Exception as exc:
            elapsed_seconds = time.monotonic() - start_time
            logger.exception("kiro-cli adapter run failed")
            return AdapterResult(
                success=False,
                output_dir=config.output_dir,
                workspace_dir=workspace,
                error=f"kiro-cli adapter error: {exc}",
                elapsed_seconds=elapsed_seconds,
            )
