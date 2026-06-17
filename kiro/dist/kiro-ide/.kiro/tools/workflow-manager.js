#!/usr/bin/env node
/**
 * workflow-manager.js — Manages workflow.json. Called only by the orchestrator.
 *
 * Subcommands:
 *   add-stage    — Add an approved stage to the workflow plan
 *   set-depth    — Set the workflow depth level
 *   set-composed — Mark the workflow as composed (timestamp)
 *
 * Exit codes:
 *   0 — Success
 *   1 — Validation failure
 *   2 — Usage error
 */

const fs = require("fs");
const path = require("path");

// --- Helpers ---

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    return null;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function now() {
  return new Date().toISOString();
}

function fail(message, code = 1) {
  console.log(JSON.stringify({ success: false, error: message }));
  process.exit(code);
}

function succeed(message, data = {}) {
  console.log(JSON.stringify({ success: true, message, ...data }));
  process.exit(0);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function resolveIntentDir(args) {
  const intentDir = args.intent;
  if (!intentDir) fail("Missing --intent <dir>", 2);
  if (!fs.existsSync(intentDir)) fail(`Intent directory not found: ${intentDir}`, 2);
  return intentDir;
}

function loadWorkflow(intentDir) {
  const wfPath = path.join(intentDir, "workflow.json");
  let wf = readJson(wfPath);
  if (!wf) {
    wf = { intent: path.basename(intentDir), composed: "", depth: "standard", stages: [] };
  }
  return wf;
}

function saveWorkflow(intentDir, workflow) {
  const wfPath = path.join(intentDir, "workflow.json");
  writeJson(wfPath, workflow);
}

// --- Subcommands ---

function handleAddStage(args) {
  const intentDir = resolveIntentDir(args);
  const stageName = args.stage;
  const owner = args.owner;
  const unit = args.unit || undefined;
  const phase = args.phase || undefined;
  const reviewer = args.reviewer || undefined;
  const contributors = args.contributors ? args.contributors.split(",").map(s => s.trim()) : undefined;
  const autonomy = args.autonomy || "supervised";
  const rationale = args.rationale || undefined;

  if (!stageName) fail("Missing --stage <name>", 2);
  if (!owner) fail("Missing --owner <persona>", 2);

  const workflow = loadWorkflow(intentDir);

  // Check for duplicate
  const existing = workflow.stages.find(s => {
    if (s.stage !== stageName) return false;
    if (unit && s.unit !== unit) return false;
    return true;
  });
  if (existing) {
    fail(`Stage '${stageName}'${unit ? ` (unit: ${unit})` : ""} already exists in workflow.json`);
  }

  // Build stage entry
  const stageEntry = { stage: stageName, owner, autonomy };
  if (unit) stageEntry.unit = unit;
  if (phase) stageEntry.phase = phase;
  if (contributors && contributors.length > 0) stageEntry.contributors = contributors;
  if (reviewer) stageEntry.reviewer = reviewer;
  if (rationale) stageEntry.rationale = rationale;

  workflow.stages.push(stageEntry);
  saveWorkflow(intentDir, workflow);

  succeed(`Stage '${stageName}' added to workflow.json.`, { stage: stageName, owner, autonomy });
}

function handleSetDepth(args) {
  const intentDir = resolveIntentDir(args);
  const depth = args.depth;

  if (!depth) fail("Missing --depth <minimal|standard|comprehensive>", 2);

  const valid = ["minimal", "standard", "comprehensive"];
  if (!valid.includes(depth)) {
    fail(`Invalid depth '${depth}'. Valid: [${valid.join(", ")}]`);
  }

  const workflow = loadWorkflow(intentDir);
  workflow.depth = depth;
  saveWorkflow(intentDir, workflow);

  succeed(`Depth set to '${depth}'.`, { depth });
}

function handleSetComposed(args) {
  const intentDir = resolveIntentDir(args);

  const workflow = loadWorkflow(intentDir);
  workflow.composed = now();
  saveWorkflow(intentDir, workflow);

  succeed("Workflow marked as composed.", { composed: workflow.composed });
}

// --- Main Dispatch ---

const subcommand = process.argv[2];
const args = parseArgs(process.argv.slice(3));

switch (subcommand) {
  case "add-stage":
    handleAddStage(args);
    break;
  case "set-depth":
    handleSetDepth(args);
    break;
  case "set-composed":
    handleSetComposed(args);
    break;
  default:
    console.error(`Usage: node workflow-manager.js <subcommand> [options]

Subcommands:
  add-stage              Add an approved stage to workflow.json
    --intent <dir>       Intent directory (required)
    --stage <name>       Stage name (required)
    --owner <persona>    Owner persona (required)
    --phase <name>       Phase (inception/construction/operations)
    --unit <name>        Unit name (for per-unit stages)
    --contributors <a,b> Comma-separated contributor personas
    --reviewer <name>    Reviewer persona
    --autonomy <mode>    supervised|guided|full (default: supervised)
    --rationale <text>   Why this stage was included

  set-depth              Set workflow depth
    --intent <dir>       Intent directory (required)
    --depth <level>      minimal|standard|comprehensive (required)

  set-composed           Mark workflow as composed (sets timestamp)
    --intent <dir>       Intent directory (required)
`);
    process.exit(2);
}
