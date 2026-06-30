// t188-kiro-ide-hook-adapter: the Kiro IDE hook shim reads context from the
// USER_PROMPT env var (NOT stdin) and normalizes it into the core hooks'
// contract. Empirically, Kiro IDE 0.12-main delivers a JSON env var
// { toolName, toolArgs (always {}), toolResult, toolSuccess } and never writes
// stdin, so the IDE adapter scrapes the written file path out of toolResult and
// drives the payload-free hooks (runtime-compile, sync-statusline) off the
// audit tail.
//
// covers: file:hooks/aidlc-sync-statusline.ts, file:hooks/aidlc-audit-logger.ts, file:hooks/aidlc-runtime-compile.ts
//
// WHY SUBPROCESS. The adapter IS a subprocess shim — in-process unit testing
// would bypass the exact env/stdout/exit-code surface being contracted. Each
// case runs `bun dist/kiro-ide/.kiro/hooks/aidlc-kiro-adapter.ts <target>` with
// USER_PROMPT set to a captured IDE context and asserts the observable effect.

import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { hostname, tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_RECORD_DIR,
  DEFAULT_SPACE,
  intentsDirOf,
  seededAuditDir,
  seededRecordDir,
  seededStateFile,
} from "../harness/fixtures.ts";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const KIRO_IDE_TREE = join(REPO_ROOT, "dist", "kiro-ide", ".kiro");

const PINNED_CLONE_ID = "testcloneid188";
function pinnedShardName(): string {
  const host =
    hostname()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "host";
  return `${host}-${PINNED_CLONE_ID}.md`;
}

function seedShell(dir: string): void {
  const intentsDir = intentsDirOf(dir, DEFAULT_SPACE);
  mkdirSync(join(dir, "aidlc", "spaces", DEFAULT_SPACE, "memory"), { recursive: true });
  mkdirSync(seededRecordDir(dir), { recursive: true });
  writeFileSync(join(dir, "aidlc", "active-space"), `${DEFAULT_SPACE}\n`, "utf-8");
  writeFileSync(join(intentsDir, "active-intent"), `${DEFAULT_RECORD_DIR}\n`, "utf-8");
  writeFileSync(
    join(intentsDir, "intents.json"),
    `${JSON.stringify(
      [{ uuid: "00000000-0000-7000-8000-000000000001", slug: DEFAULT_RECORD_DIR.replace(/-[0-9a-f]+$/, ""), status: "in-flight" }],
      null,
      2,
    )}\n`,
    "utf-8",
  );
}

function scratchProject(withState: boolean): string {
  const dir = mkdtempSync(join(tmpdir(), "t188-"));
  cpSync(KIRO_IDE_TREE, join(dir, ".kiro"), { recursive: true });
  seedShell(dir);
  if (withState) {
    writeFileSync(
      seededStateFile(dir),
      readFileSync(join(REPO_ROOT, "tests", "fixtures", "state-brownfield-feature.md"), "utf-8"),
    );
    writeFileSync(join(dir, "aidlc", ".aidlc-clone-id"), `${PINNED_CLONE_ID}\n`, "utf-8");
    const auditDir = seededAuditDir(dir);
    mkdirSync(auditDir, { recursive: true });
    writeFileSync(join(auditDir, pinnedShardName()), "# AI-DLC Audit Log\n");
  }
  return dir;
}

function readAudit(dir: string): string {
  const auditDir = seededAuditDir(dir);
  let names: string[];
  try {
    names = readdirSync(auditDir);
  } catch {
    return "";
  }
  return names
    .filter((n) => n.endsWith(".md"))
    .sort()
    .map((n) => readFileSync(join(auditDir, n), "utf-8"))
    .join("\n");
}

/** Append a STAGE_STARTED block for <slug> to the seeded audit shard. */
function appendStageStarted(dir: string, slug: string, ts: string): void {
  const shard = join(seededAuditDir(dir), pinnedShardName());
  const block = `\n## Stage Start\n**Timestamp**: ${ts}\n**Event**: STAGE_STARTED\n**Stage**: ${slug}\n**Agent**: orchestrator\n\n---\n`;
  writeFileSync(shard, readFileSync(shard, "utf-8") + block, "utf-8");
}

/** Run the IDE adapter with USER_PROMPT set (the IDE's context channel). stdin
 *  is intentionally NOT written — the IDE never writes it. */
function runIde(
  projectDir: string,
  target: string,
  userPrompt: string | null,
): { stdout: string; code: number } {
  const env: Record<string, string> = { ...process.env, CLAUDE_PROJECT_DIR: projectDir };
  if (userPrompt === null) {
    delete (env as Record<string, string | undefined>).USER_PROMPT;
  } else {
    env.USER_PROMPT = userPrompt;
  }
  const r = spawnSync(
    "bun",
    [join(projectDir, ".kiro", "hooks", "aidlc-kiro-adapter.ts"), target],
    { cwd: projectDir, input: "", encoding: "utf-8", env, timeout: 30_000 },
  );
  return { stdout: r.stdout ?? "", code: r.status ?? -1 };
}

function ctx(toolName: string, toolResult: string): string {
  return JSON.stringify({ toolName, toolArgs: {}, toolResult, toolSuccess: true });
}

describe("t188 Kiro IDE hook adapter (USER_PROMPT env context)", () => {
  test("1: audit-and-sensors resolves a RELATIVE toolResult path (real IDE shape) and logs CREATE", () => {
    const dir = scratchProject(true);
    try {
      const file = join(seededRecordDir(dir), "ideation", "intent-capture", "intent.md");
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, "# intent\n");
      // Kiro IDE reports the path RELATIVE to the workspace root (the bug that
      // made audit-logger's absolute-recordRoot gate reject every write). The
      // adapter must resolve it against the project dir before forwarding.
      const relPath = relative(dir, file);
      expect(isAbsolute(relPath)).toBe(false); // premise: this is a relative path
      const r = runIde(dir, "audit-and-sensors", ctx("fs_write", `Created the ${relPath} file.`));
      expect(r.code).toBe(0);
      const audit = readAudit(dir);
      expect(audit).toContain("ARTIFACT_CREATED");
      expect(audit).toContain("intent-capture");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("2: audit-and-sensors extracts the path from a str_replace toolResult (UPDATE)", () => {
    const dir = scratchProject(true);
    try {
      const file = join(seededRecordDir(dir), "ideation", "intent-capture", "intent.md");
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, "# intent edited\n");
      const r = runIde(dir, "audit-and-sensors", ctx("str_replace", `Replaced text in ${file}`));
      expect(r.code).toBe(0);
      expect(readAudit(dir)).toContain("ARTIFACT_UPDATED");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("3: audit-and-sensors extracts the path from a fs_append toolResult", () => {
    const dir = scratchProject(true);
    try {
      const file = join(seededRecordDir(dir), "ideation", "intent-capture", "intent.md");
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, "# intent appended\n");
      const r = runIde(dir, "audit-and-sensors", ctx("fs_append", `Appended the text to the ${file} file.`));
      expect(r.code).toBe(0);
      expect(readAudit(dir)).toContain("ARTIFACT_");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("4: audit-and-sensors fails open on an unrecognized toolResult wording", () => {
    const dir = scratchProject(true);
    try {
      const before = readAudit(dir);
      const r = runIde(dir, "audit-and-sensors", ctx("fs_write", "Wrote something somewhere"));
      expect(r.code).toBe(0);
      expect(readAudit(dir)).toBe(before); // no ARTIFACT_* row added
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("5: state-sync derives Current Stage from the audit tail (no payload)", () => {
    const dir = scratchProject(true);
    try {
      // Seed a later STAGE_STARTED than the fixture's Current Stage.
      appendStageStarted(dir, "user-stories", "2026-06-30T10:00:00.000Z");
      const r = runIde(dir, "state-sync", ctx("spec", "task updated"));
      expect(r.code).toBe(0);
      expect(/\*\*Current Stage\*\*:\s*user-stories/.test(readFileSync(seededStateFile(dir), "utf-8"))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("6: state-sync is a clean no-op when the audit tail matches Current Stage", () => {
    const dir = scratchProject(true);
    try {
      const current = (readFileSync(seededStateFile(dir), "utf-8").match(/\*\*Current Stage\*\*:\s*([a-z0-9-]+)/) ?? [])[1];
      expect(current).toBeDefined();
      appendStageStarted(dir, current as string, "2026-06-30T10:00:00.000Z");
      const r = runIde(dir, "state-sync", ctx("spec", "task updated"));
      expect(r.code).toBe(0);
      expect(r.stdout.trim()).toBe("");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("7: runtime-compile dispatches off the audit tail with no command", () => {
    const dir = scratchProject(true);
    try {
      // A transition in the tail makes the core hook recompile; with no
      // transition it self-gates. Either way the adapter exits 0.
      const r = runIde(dir, "runtime-compile", ctx("execute_bash", "Output:\nok\n\nExit Code: 0"));
      expect(r.code).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("7b: runtime-compile actually compiles when the audit tail has a transition (no command needed)", () => {
    const dir = scratchProject(true);
    try {
      // Seed a STAGE_STARTED transition in the tail. The IDE never surfaces the
      // shell command, so the only way the graph compiles is the audit-tail
      // path (command filter skipped via the ide-audit-sync marker).
      appendStageStarted(dir, "intent-capture", "2026-06-30T10:00:00.000Z");
      const graphPath = join(seededRecordDir(dir), "runtime-graph.json");
      const r = runIde(dir, "runtime-compile", ctx("execute_bash", "Output:\nok\n\nExit Code: 0"));
      expect(r.code).toBe(0);
      // The compile wrote the runtime graph — proof the command filter was
      // bypassed and the audit-tail gate fired.
      expect(existsSync(graphPath)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("8: session-start emits plain-text context, not the JSON wrapper", () => {
    const dir = scratchProject(true);
    try {
      const r = runIde(dir, "session-start", null);
      expect(r.code).toBe(0);
      expect(r.stdout).toContain("AIDLC WORKFLOW ACTIVE");
      expect(r.stdout).not.toContain("additionalContext");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("9: stop blocks with a reason while the workflow has pending work", () => {
    const dir = scratchProject(true);
    try {
      const r = runIde(dir, "stop", null);
      expect(r.code).toBe(0);
      const out = JSON.parse(r.stdout) as { decision?: string };
      expect(out.decision).toBe("block");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("10: a missing USER_PROMPT fails open (exit 0) on payload targets", () => {
    const dir = scratchProject(true);
    try {
      for (const target of ["audit-and-sensors"]) {
        const r = runIde(dir, target, null);
        expect(`${target}:${r.code}`).toBe(`${target}:0`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("11: malformed USER_PROMPT fails open (exit 0)", () => {
    const dir = scratchProject(true);
    try {
      const r = runIde(dir, "audit-and-sensors", "{not json");
      expect(r.code).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("12: the IDE adapter does NOT read stdin (no hang when stdin stays open)", () => {
    // Regression guard for the root cause: the old adapter awaited stdin and
    // hung 2s. The new one reads USER_PROMPT, so even with NO stdin written it
    // returns promptly. spawnSync with input:"" closes stdin immediately; the
    // contract we pin is "exits 0 fast off the env var".
    const dir = scratchProject(true);
    try {
      const file = join(seededRecordDir(dir), "ideation", "intent-capture", "intent.md");
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, "# intent\n");
      const r = runIde(dir, "audit-and-sensors", ctx("fs_write", `Created the ${file} file.`));
      expect(r.code).toBe(0);
      expect(readAudit(dir)).toContain("ARTIFACT_CREATED");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("13: hook-debug.log is OPT-IN — absent without AIDLC_HOOK_DEBUG, present with it", () => {
    const debugLogPath = (dir: string) =>
      join(seededRecordDir(dir), ".aidlc-hooks-health", "hook-debug.log");
    const fire = (dir: string, withFlag: boolean) => {
      const file = join(seededRecordDir(dir), "ideation", "intent-capture", "intent.md");
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, "# intent\n");
      const env: Record<string, string> = { ...process.env, CLAUDE_PROJECT_DIR: dir };
      env.USER_PROMPT = ctx("fs_write", `Created the ${file} file.`);
      if (withFlag) env.AIDLC_HOOK_DEBUG = "1";
      else delete (env as Record<string, string | undefined>).AIDLC_HOOK_DEBUG;
      spawnSync("bun", [join(dir, ".kiro", "hooks", "aidlc-kiro-adapter.ts"), "audit-and-sensors"], {
        cwd: dir,
        input: "",
        encoding: "utf-8",
        env,
        timeout: 30_000,
      });
    };

    // Off by default: USER_PROMPT alone must NOT enable debug logging.
    const dirOff = scratchProject(true);
    try {
      fire(dirOff, false);
      expect(existsSync(debugLogPath(dirOff))).toBe(false);
    } finally {
      rmSync(dirOff, { recursive: true, force: true });
    }

    // On with the flag: the decision trace is written.
    const dirOn = scratchProject(true);
    try {
      fire(dirOn, true);
      expect(existsSync(debugLogPath(dirOn))).toBe(true);
      expect(readFileSync(debugLogPath(dirOn), "utf-8")).toContain("audit-logger");
    } finally {
      rmSync(dirOn, { recursive: true, force: true });
    }
  });
});
