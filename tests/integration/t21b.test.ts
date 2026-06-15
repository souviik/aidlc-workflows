// covers: subcommand:aidlc-utility:init
//
// t21b.test.ts — SDK-harness port of tests/integration/t21b-integration-init-idempotent.sh
// (plan 6). Drives the real `/aidlc --init` (twice) + `/aidlc --init --force`
// through the Claude Agent SDK and asserts ONLY on deterministic surfaces — the
// on-disk state-file structure, the parsed audit events, and the verbatim init-CLI
// stdout in the Bash tool_result — NEVER on assistantText.
//
// WHY THIS PORT EXISTS. The .sh asserted the --force / re-init contract entirely
// by grepping the post-run aidlc-state.md + audit.md on disk (stage-checkbox
// count, Lifecycle Phase, WORKFLOW_STARTED count, workflow-state-event count).
// Those are NOT prose-flaky — they read the FILES the deterministic init tool
// wrote, not the LLM's rendering. But the .sh reached them through a `claude -p`
// subprocess + run_claude exit semantics; this port reaches the SAME files
// through driveAidlc, so the assertions become structured reads (readStateField /
// auditEvents) instead of shell greps. Equal-or-stronger on every line.
//
// NO --test-run. The .sh never used --test-run (init is gate-free: SKILL.md:531
// routes --init to `aidlc-utility.ts init`, which prints state and STOPS,
// SKILL.md:54 print-terminal). So this port carries none either — there is no
// auto-approve to drop. The init rejection on a 2nd bare --init is a deterministic
// tool guard (aidlc-utility.ts:1746-1749 `die(... Use --force to reinitialize)`);
// the orchestrator honours it and STOPS, so we assert the BEHAVIORAL consequence:
// state + workflow-state audit events unchanged.
//
// THE THREE-RUN JOURNEY (verified against the SHIPPED handler):
//   run 1: `/aidlc --init` on a fresh project -> handleInit scaffolds + writes
//          aidlc-state.md, emits WORKFLOW_STARTED (utility.ts:1784) + the init
//          phase events. Baseline captured off disk.
//   run 2: `/aidlc --init` again, state present, NO --force -> the init tool
//          die()s with "aidlc-state.md already exists ... Use --force to
//          reinitialize" (utility.ts:1746-1749). The orchestrator honours the
//          rejection; state structure + the workflow-state audit stream
//          (WORKFLOW_/PHASE_/STAGE_/GATE_) are UNCHANGED. (SESSION_* events are
//          hook-owned per Claude session and tracked separately — the .sh's
//          exact discrimination, t21b.sh:46-52.)
//   run 3: `/aidlc --init --force` -> the force path removes the state file
//          (utility.ts:1761 rmSync) and re-inits: exits 0, re-writes state with
//          [x] workspace-scaffold, and appends a FRESH WORKFLOW_STARTED without
//          wiping audit (utility.ts:1782-1787 "Fires on both fresh init and
//          --force re-init"). So the WORKFLOW_STARTED count GREW.
//
// ASSERTION MAP (.sh test -> deterministic SDK surface, equal-or-stronger):
//   1 state structure unchanged after rejected re-init
//       -> after run 2: the `- [` stage-checkbox count AND the Lifecycle Phase
//          field are byte-equal to the run-1 baseline (read off disk). The .sh
//          compared `grep -c '^- ['` + the Lifecycle Phase sed; we compare the
//          same two structural surfaces.
//   2 workflow state events unchanged after rejected re-init
//       -> after run 2: the count of WORKFLOW_/PHASE_/STAGE_/GATE_ audit events
//          (readAuditEvents, filtered) is byte-equal to the run-1 baseline. The
//          .sh grepped `^**Event**: (WORKFLOW_|PHASE_|STAGE_|GATE_)`; we filter
//          the parsed event-type list the same way (SESSION_* excluded — they
//          fire per claude session, not per workflow state).
//   3 third --init --force exits zero
//       -> the run-3 init Bash tool_result is non-error (is_error === false).
//   4 state file still exists after --force reinit
//       -> existsSync(<proj>/aidlc-docs/aidlc-state.md) after run 3.
//   5 --force reinit produces [x] workspace-scaffold
//       -> the run-3 state file contains "[x] workspace-scaffold" (init phase
//          marker always [x], utility.ts:1995-1998).
//   6 audit gained a 2nd WORKFLOW_STARTED on --force (not wiped)
//       -> count of WORKFLOW_STARTED in parsed auditEvents after run 3 > the
//          run-1 baseline count (force appends a fresh one, utility.ts:1784;
//          SESSION_* are NOT --force-driven).
//
// Known-answer literals (read from the SHIPPED handler, not guessed):
//   - --init dispatch:            SKILL.md:531 -> `bun .claude/tools/aidlc-utility.ts init` via Bash, stdout verbatim
//   - re-init rejection:          aidlc-utility.ts:1746-1749 (die on existing state, no --force)
//   - --force removes state:      aidlc-utility.ts:1753-1762 (rmSync of the state file)
//   - WORKFLOW_STARTED on init AND --force:  aidlc-utility.ts:1782-1787
//   - State initialized summary:  aidlc-utility.ts:2154 ("State initialized:")
//   - init-stage [x] markers:     aidlc-utility.ts:1995-1998
//
// It SPENDS TOKENS — each driveAidlc drives the real /aidlc on Opus/Bedrock (×3).
// Generous per-test timeout so a hung canUseTool fails LOUD via bun:test.

import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { assertToolResultContains } from "../harness/assert.ts";
import {
  cleanupTestProject,
  setupIntegrationProject,
} from "../harness/fixtures.ts";
import {
  driveAidlc,
  readAuditEvents,
  readStateField,
  readStateFile,
} from "../harness/sdk-drive.ts";

// ---------------------------------------------------------------------------
// Timeout budget — three real --init turns on Opus/Bedrock. The .sh ran under
// the suite default; honour the AIDLC_TEST_TIMEOUT convention. The driver aborts
// ~15s before bun's per-test cap so a stuck canUseTool surfaces a partial
// DriveResult to diagnose rather than an opaque hang. The cap covers all three
// runs (they share the test).
// ---------------------------------------------------------------------------
const TIMEOUT_S = Number.parseInt(process.env.AIDLC_TEST_TIMEOUT ?? "900", 10);
const TEST_TIMEOUT_MS = (Number.isFinite(TIMEOUT_S) ? TIMEOUT_S : 900) * 1000;
const DRIVE_TIMEOUT_MS = Math.max(120_000, Math.floor(TEST_TIMEOUT_MS / 3) - 15_000);

// Known-answer literals from the SHIPPED init handler (see header for file:line).
const INIT_STATE_SUMMARY = "State initialized:"; // utility.ts:2154 (fresh + force)
const STOP_AFTER_INIT = { toolName: "Bash", resultIncludes: INIT_STATE_SUMMARY } as const;
const REINIT_REJECTION = "Use --force to reinitialize"; // utility.ts:1748
const STOP_AFTER_REINIT_REJECTION = {
  toolName: "Bash",
  resultIncludes: REINIT_REJECTION,
} as const;
const WORKFLOW_STARTED = "WORKFLOW_STARTED";

/** Count `- [` stage-checkbox rows in a state-file string — the deterministic
 *  equivalent of the .sh's `grep -c '^- ['` structural count. */
function stageRowCount(stateText: string): number {
  return (stateText.match(/^- \[/gm) ?? []).length;
}

/** Count workflow-state audit events (WORKFLOW_/PHASE_/STAGE_/GATE_) in a parsed
 *  event-type list — the .sh's `grep -cE '^**Event**: (WORKFLOW_|PHASE_|STAGE_|GATE_)'`.
 *  SESSION_* events fire per claude session independent of workflow state, so
 *  they are deliberately EXCLUDED (the .sh's exact discrimination, t21b.sh:46-52). */
function workflowStateEventCount(events: string[]): number {
  return events.filter((e) => /^(WORKFLOW_|PHASE_|STAGE_|GATE_)/.test(e)).length;
}

/** Count occurrences of a specific event type in a parsed event-type list. */
function countEvent(events: string[], event: string): number {
  return events.filter((e) => e === event).length;
}

describe("t21b /aidlc --init idempotency / --force (sdk)", () => {
  // -------------------------------------------------------------------------
  // Three sequential runs against ONE fresh project: establish -> rejected
  // re-init (state/audit unchanged) -> --force (succeeds, fresh WORKFLOW_STARTED
  // without wiping audit). Every .sh assertion re-expressed on the post-run
  // state + audit files, read off disk.
  // -------------------------------------------------------------------------
  test(
    "second bare --init is rejected (state + workflow events unchanged); --force re-inits and appends a fresh WORKFLOW_STARTED",
    async () => {
      const proj = setupIntegrationProject({ noAidlcDocs: true });
      try {
        const statePath = join(proj, "aidlc-docs", "aidlc-state.md");

        // ---- run 1: establish state ----
        const r1 = await driveAidlc("/aidlc --init", {
          projectDir: proj,
          timeoutMs: DRIVE_TIMEOUT_MS,
          stopAfterToolResult: STOP_AFTER_INIT,
        });
        // The init CLI fired (no vacuous pass) and the state file landed.
        assertToolResultContains(r1, "Bash", INIT_STATE_SUMMARY);
        expect(existsSync(statePath)).toBe(true);

        const stateBaseline = readStateFile(proj);
        expect(stateBaseline).toBeDefined();
        const stagesBaseline = stageRowCount(stateBaseline as string);
        const phaseBaseline = readStateField(stateBaseline as string, "Lifecycle Phase");
        expect(stagesBaseline).toBeGreaterThan(0);
        expect(phaseBaseline).toBeDefined();

        const eventsBaseline = readAuditEvents(proj) ?? [];
        const workflowEventsBaseline = workflowStateEventCount(eventsBaseline);
        const workflowStartedBaseline = countEvent(eventsBaseline, WORKFLOW_STARTED);
        expect(workflowStartedBaseline).toBeGreaterThanOrEqual(1);

        // ---- run 2: bare --init again -> rejected (no --force) ----
        // The init tool die()s "already exists ... Use --force" (utility.ts:1746).
        // We don't assert the rejection prose (LLM-reworded); we assert the
        // BEHAVIORAL consequence on disk: state + workflow events unchanged.
        const r2 = await driveAidlc("/aidlc --init", {
          projectDir: proj,
          timeoutMs: DRIVE_TIMEOUT_MS,
          // Stop at the deterministic tool boundary. Otherwise a live model can
          // spend extra turns treating the rejected init as a normal resume.
          stopAfterToolResult: STOP_AFTER_REINIT_REJECTION,
        });
        assertToolResultContains(r2, "Bash", REINIT_REJECTION);

        // .sh test 1: state structure unchanged after the rejected re-init.
        const stateAfterReject = readStateFile(proj);
        expect(stateAfterReject).toBeDefined();
        expect(stageRowCount(stateAfterReject as string)).toBe(stagesBaseline);
        expect(readStateField(stateAfterReject as string, "Lifecycle Phase")).toBe(
          phaseBaseline as string,
        );

        // .sh test 2: workflow-state audit events unchanged after the rejection.
        const eventsAfterReject = readAuditEvents(proj) ?? [];
        expect(workflowStateEventCount(eventsAfterReject)).toBe(workflowEventsBaseline);

        // ---- run 3: --init --force -> succeeds, re-inits, fresh WORKFLOW_STARTED ----
        const r3 = await driveAidlc("/aidlc --init --force", {
          projectDir: proj,
          timeoutMs: DRIVE_TIMEOUT_MS,
          stopAfterToolResult: STOP_AFTER_INIT,
        });

        // .sh test 3: the --force init exited 0 — the init Bash tool_result is
        // non-error. assertToolResultContains also proves the tool fired.
        assertToolResultContains(r3, "Bash", INIT_STATE_SUMMARY);
        const forceCall = r3.toolResults.find(
          (t) => t.toolName === "Bash" && t.resultText.includes(INIT_STATE_SUMMARY),
        );
        expect(forceCall?.isError).toBe(false);

        // .sh test 4: state file still exists after the --force reinit.
        expect(existsSync(statePath)).toBe(true);
        const stateAfterForce = readStateFile(proj);
        expect(stateAfterForce).toBeDefined();

        // .sh test 5: the --force reinit re-wrote the state with [x] workspace-scaffold
        // (the init phase marker is always [x], utility.ts:1995-1998).
        expect(stateAfterForce as string).toContain("[x] workspace-scaffold");

        // .sh test 6: the audit GAINED a fresh WORKFLOW_STARTED on --force (not
        // wiped). Count strictly greater than the run-1 baseline. SESSION_* are
        // hook-owned and not --force-driven, so the discrimination matches the .sh.
        const eventsAfterForce = readAuditEvents(proj) ?? [];
        expect(countEvent(eventsAfterForce, WORKFLOW_STARTED)).toBeGreaterThan(
          workflowStartedBaseline,
        );
      } finally {
        cleanupTestProject(proj);
      }
    },
    TEST_TIMEOUT_MS,
  );
});
