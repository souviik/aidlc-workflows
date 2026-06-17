#!/usr/bin/env node
/**
 * validate-rules.js — Validates rules.yaml from the functional-design stage.
 *
 * Checks:
 *   - YAML parses correctly (multi-document list)
 *   - Each rule has required fields: id, statement, category, trigger, logic, violation
 *   - Rule IDs are unique
 *   - Category is one of the allowed values
 *   - applies-to references valid component/entity IDs (if --references provided)
 *
 * Usage:
 *   node validate-rules.js --file <path-to-rules.yaml> [--references <path-to-entities.yaml>]
 *
 * Exit codes:
 *   0 — Valid (may have warnings)
 *   1 — Invalid (has errors)
 *   2 — Usage error
 */

const fs = require("fs");
const path = require("path");

const VALID_CATEGORIES = [
  "validation",
  "authorization",
  "constraint",
  "calculation",
  "policy",
];

// --- Parse rules.yaml ---

function parseRulesYaml(content) {
  const docs = content.split(/^---\s*$/m).filter(d => d.trim().length > 0);
  const rules = [];

  for (const doc of docs) {
    const parsed = parseRuleEntries(doc.trim());
    rules.push(...parsed);
  }

  return rules;
}

function parseRuleEntries(text) {
  const rules = [];
  const lines = text.split("\n");

  let current = null;
  let currentKey = null;

  for (const line of lines) {
    const trimmed = line.trimEnd();

    // New rule item (starts with "- id:")
    if (trimmed.match(/^- id:\s*/)) {
      if (current) rules.push(current);
      current = { "applies-to": {} };
      current.id = trimmed.replace(/^- id:\s*/, "").trim();
      currentKey = null;
      continue;
    }

    if (!current) continue;

    // Top-level field
    const fieldMatch = trimmed.match(/^\s{2}(\w[\w-]*):\s*(.*)$/);
    if (fieldMatch) {
      const key = fieldMatch[1];
      const val = fieldMatch[2].trim().replace(/^["']|["']$/g, "");

      if (key === "applies-to") {
        currentKey = "applies-to";
        continue;
      }
      if (key === "source") {
        currentKey = "source";
        continue;
      }

      if (currentKey === "applies-to") {
        current["applies-to"][key] = val;
      } else {
        current[key] = val;
        currentKey = key;
      }
      continue;
    }

    // Nested field under applies-to
    const nestedMatch = trimmed.match(/^\s{4}(\w[\w-]*):\s*(.*)$/);
    if (nestedMatch && currentKey === "applies-to") {
      current["applies-to"][nestedMatch[1]] = nestedMatch[2].trim();
      continue;
    }
  }

  if (current) rules.push(current);
  return rules;
}

// Extract entity IDs from entities.yaml
function extractEntityIds(content) {
  const ids = new Set();
  for (const line of content.split("\n")) {
    const match = line.match(/^- id:\s*(\S+)/) || line.match(/^\s{2}id:\s*(\S+)/);
    if (match) ids.add(match[1]);
  }
  return ids;
}

// --- Validation Logic ---

function validate(rules, entityIds) {
  const errors = [];
  const warnings = [];
  const ids = new Set();

  for (let i = 0; i < rules.length; i++) {
    const r = rules[i];
    const label = r.id || `rule[${i}]`;

    // Required fields
    if (!r.id) {
      errors.push(`${label}: missing required field 'id'`);
    }
    if (!r.statement) {
      errors.push(`${label}: missing required field 'statement'`);
    }
    if (!r.category) {
      errors.push(`${label}: missing required field 'category'`);
    }
    if (!r.trigger) {
      errors.push(`${label}: missing required field 'trigger'`);
    }
    if (!r.logic) {
      errors.push(`${label}: missing required field 'logic'`);
    }
    if (!r.violation) {
      errors.push(`${label}: missing required field 'violation'`);
    }

    // Unique IDs
    if (r.id) {
      if (ids.has(r.id)) {
        errors.push(`${label}: duplicate rule ID`);
      }
      ids.add(r.id);
    }

    // Valid category
    if (r.category && !VALID_CATEGORIES.includes(r.category)) {
      warnings.push(`${label}: category '${r.category}' not in standard set [${VALID_CATEGORIES.join(", ")}]`);
    }

    // applies-to should reference something
    if (!r["applies-to"] || Object.keys(r["applies-to"]).length === 0) {
      warnings.push(`${label}: no 'applies-to' references (component-id, entity-id, or api-id)`);
    }

    // Cross-reference entity-id against upstream
    if (entityIds && r["applies-to"] && r["applies-to"]["entity-id"]) {
      const refId = r["applies-to"]["entity-id"];
      if (!entityIds.has(refId)) {
        errors.push(`${label}: entity-id '${refId}' not found in upstream entities.yaml`);
      }
    }
  }

  return { errors, warnings };
}

// --- Main ---

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--file" && process.argv[i + 1]) {
    args.file = process.argv[++i];
  } else if (process.argv[i] === "--references" && process.argv[i + 1]) {
    args.references = process.argv[++i];
  }
}

if (!args.file) {
  console.error("Usage: node validate-rules.js --file <path> [--references <entities.yaml>]");
  process.exit(2);
}

if (!fs.existsSync(args.file)) {
  console.log(JSON.stringify({ valid: false, errors: [`File not found: ${args.file}`], warnings: [] }));
  process.exit(1);
}

const content = fs.readFileSync(args.file, "utf-8");

let rules;
try {
  rules = parseRulesYaml(content);
} catch (e) {
  console.log(JSON.stringify({ valid: false, errors: [`YAML parse error: ${e.message}`], warnings: [] }));
  process.exit(1);
}

if (rules.length === 0) {
  console.log(JSON.stringify({ valid: false, errors: ["No rules found in file"], warnings: [] }));
  process.exit(1);
}

// Load upstream references if provided
let entityIds = null;
if (args.references && fs.existsSync(args.references)) {
  const refContent = fs.readFileSync(args.references, "utf-8");
  entityIds = extractEntityIds(refContent);
}

const { errors, warnings } = validate(rules, entityIds);

const result = {
  valid: errors.length === 0,
  ruleCount: rules.length,
  errors,
  warnings,
};

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
