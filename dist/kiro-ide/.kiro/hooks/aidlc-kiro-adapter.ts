#!/usr/bin/env bun
// aidlc-kiro-adapter.ts — the Kiro IDE hook shim (AUTHORED shell file; the
// aidlc-*.ts hook bodies beside it are PACKAGED core, byte-shared with the
// Claude Code harness). This is the IDE-specific adapter; the CLI harness ships
// its own (harness/kiro/) which reads stdin. They are deliberately separate
// files so neither carries a runtime "am I CLI or IDE?" branch.
//
// Kiro IDE hook context (live-captured on Kiro IDE 0.12-main — see
// tmp/hook-probe-findings.md):
//   1. stdin is OPENED BUT NEVER WRITTEN/CLOSED — reading it hangs. The IDE
//      delivers context through the `USER_PROMPT` environment variable instead.
//   2. USER_PROMPT is JSON: { toolName, toolArgs, toolResult, toolSuccess }.
//      `toolArgs` is ALWAYS empty {} — the IDE never passes tool inputs. So the
//      file path is recoverable ONLY from the `toolResult` prose, and the shell
//      command is not recoverable at all (toolResult carries only stdout+exit).
//   3. toolName arrives as the IDE tool name: `fs_write`, `str_replace`,
//      `fs_append`, `execute_bash`, etc.
//
// Consequences, by target:
//   - audit-and-sensors: scrape the written file path from toolResult prose
//     (strict patterns, fail-open) and feed the core hooks the Claude-shaped
//     {tool_input:{file_path}}.
//   - runtime-compile: the command is unrecoverable, so drop the command
//     filter and always forward — the core hook self-gates on the audit tail.
//   - state-sync: payload-independent — the core hook reads the latest
//     STAGE_STARTED slug from the audit tail (no task payload needed).
//   - session-start/session-end/stop/log-subagent: no file path / command
//     needed; build the same fixed inputs as before.
//
// session-start emits {"additionalContext": "..."} — Kiro's context channel is
// plain stdout at exit 0, so the shim unwraps the JSON and prints the text.
// stop emits {"decision":"block","reason":"..."} — passed through verbatim.
//
// Usage (registered in .kiro/hooks/*.kiro.hook):
//   bun .kiro/hooks/aidlc-kiro-adapter.ts <target>
// where <target> ∈ session-start | audit-and-sensors | runtime-compile |
//                  state-sync | log-subagent | stop | session-end

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HOOKS_DIR = dirname(fileURLToPath(import.meta.url));
const target = process.argv[2] ?? "";

// The IDE hands hook context via the USER_PROMPT env var (NOT stdin). Shape:
//   { toolName, toolArgs (always {}), toolResult, toolSuccess }
interface IdeHookContext {
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: string;
  toolSuccess?: boolean;
}

let ide: IdeHookContext = {};
{
  const raw = process.env.USER_PROMPT ?? "";
  if (raw.length > 0) {
    try {
      ide = JSON.parse(raw) as IdeHookContext;
    } catch {
      // Malformed context — advisory hooks fail open.
      ide = {};
    }
  }
}

// Extract the absolute path of the file a write tool just touched from the
// IDE's toolResult prose. toolArgs is always empty, so this is the ONLY source.
// Strict: only the three known Kiro wordings match; anything else returns "" so
// the caller fails open (no audit/sensor row for that write — advisory miss).
//   fs_write    → "Created the <PATH> file."
//   str_replace → "Replaced text in <PATH>"
//   fs_append   → "Appended the text to the <PATH> file."
function extractWrittenPath(toolResult: string): string {
  let m = toolResult.match(/^Created the (.+) file\.$/);
  if (m) return m[1];
  m = toolResult.match(/^Replaced text in (.+)$/);
  if (m) return m[1];
  m = toolResult.match(/^Appended the text to the (.+) file\.$/);
  if (m) return m[1];
  return "";
}

// Map the IDE tool name to the canonical name the core hooks match on. Write
// creates a (possibly new) file; str_replace/fs_append always target an
// existing file → Edit (forces ARTIFACT_UPDATED in the core audit-logger).
function canonicalWriteTool(name: string): "Write" | "Edit" | "" {
  if (name === "fs_write") return "Write";
  if (name === "str_replace" || name === "fs_append") return "Edit";
  return "";
}

type Forward = { hook: string; input: Record<string, unknown> } | null;

function buildForward(): Forward {
  switch (target) {
    case "session-start":
      // promptSubmit carries no source discrimination — every submit is a
      // startup from the core hook's perspective; its state-file self-gate
      // makes this a no-op outside active workflows.
      return {
        hook: "aidlc-session-start.ts",
        input: { hook_event_name: "SessionStart", source: "startup" },
      };

    case "audit-and-sensors": {
      // postToolUse(write) → audit-logger THEN sensor-fire (both ship core).
      // The file path comes from the toolResult prose (toolArgs is empty).
      const canon = canonicalWriteTool(ide.toolName ?? "");
      if (canon === "") return null;
      const filePath = extractWrittenPath(ide.toolResult ?? "");
      if (!filePath) return null;
      return {
        hook: "__audit_and_sensors__", // handled specially below (two hooks)
        input: {
          hook_event_name: "PostToolUse",
          tool_name: canon,
          tool_input: { file_path: filePath },
        },
      };
    }

    case "runtime-compile": {
      // The IDE does not surface the shell command (toolResult is only
      // stdout+exit), so the command filter cannot run here. Always forward:
      // the core hook self-gates on the audit tail (idempotent + cheap), and
      // its own MEMORY_EMPTY emit is not in the transition regex (no recursion).
      return {
        hook: "aidlc-runtime-compile.ts",
        input: {
          hook_event_name: "PostToolUse",
          tool_name: "Bash",
          tool_input: { command: "" },
        },
      };
    }

    case "state-sync": {
      // Payload-independent. The IDE gives no task payload (toolArgs is empty),
      // so instead of extracting a slug from the tool call, the core hook reads
      // the latest STAGE_STARTED slug from the audit tail and reconciles the
      // state file's Current Stage. The IDE_AUDIT_SYNC marker tells the core
      // hook to take that audit-tail path rather than parse a TaskUpdate.
      return {
        hook: "aidlc-sync-statusline.ts",
        input: {
          hook_event_name: "PostToolUse",
          tool_name: "TaskUpdate",
          tool_input: { source: "ide-audit-sync" },
        },
      };
    }

    case "log-subagent": {
      // The IDE surfaces no structured subagent roster in USER_PROMPT, so the
      // core hook records a SUBAGENT_COMPLETED with the default agent_type.
      // The event still anchors the subagent boundary in the audit trail.
      return {
        hook: "aidlc-log-subagent.ts",
        input: {
          hook_event_name: "SubagentStop",
          agent_type: "unknown",
          agent_id: "",
        },
      };
    }

    case "stop":
      // Kiro provides no stop_hook_active signal; the core hook's own
      // 8-block no-progress ceiling is the loop guard (it defaults the flag
      // to false). The {"decision":"block"} stdout contract is identical.
      return {
        hook: "aidlc-stop.ts",
        input: { hook_event_name: "Stop", stop_hook_active: false },
      };

    case "session-end":
      return {
        hook: "aidlc-session-end.ts",
        input: { hook_event_name: "SessionEnd", reason: "agent_stop" },
      };

    default:
      return null;
  }
}

function runCore(hookFile: string, input: Record<string, unknown>): { stdout: string; code: number } {
  const r = Bun.spawnSync(["bun", join(HOOKS_DIR, hookFile)], {
    stdin: Buffer.from(JSON.stringify(input), "utf-8"),
    stdout: "pipe",
    stderr: "ignore",
  });
  return { stdout: r.stdout?.toString() ?? "", code: r.exitCode ?? 0 };
}

const fwd = buildForward();
if (fwd === null) {
  process.exit(0);
  throw new Error("unreachable"); // narrows fwd for TS below
}

if (fwd.hook === "__audit_and_sensors__") {
  // Two core hooks ride the same write event, in audit-then-sensors order
  // (mirrors the Claude settings.json registration). Both advisory: exit 0.
  runCore("aidlc-audit-logger.ts", fwd.input);
  runCore("aidlc-sensor-fire.ts", fwd.input);
  process.exit(0);
}

const result = runCore(fwd.hook, fwd.input);

if (target === "session-start") {
  // Unwrap {"additionalContext": ...} → plain text on stdout (Kiro's context
  // channel). Anything unparseable passes through untouched.
  try {
    const parsed = JSON.parse(result.stdout) as { additionalContext?: string };
    if (parsed.additionalContext) {
      process.stdout.write(parsed.additionalContext);
    }
  } catch {
    if (result.stdout) process.stdout.write(result.stdout);
  }
  process.exit(0);
}

// stop (and any future passthrough target): forward stdout + exit code
// verbatim — the {"decision":"block","reason"} contract is shared.
if (result.stdout) process.stdout.write(result.stdout);
process.exit(result.code);
