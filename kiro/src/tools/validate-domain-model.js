#!/usr/bin/env node
/**
 * validate-domain-model.js — Validates components.yaml from the domain-design stage.
 *
 * Checks:
 *   - YAML parses correctly
 *   - Each component has required fields: Id, Name, Behaviour-summary
 *   - Component IDs are unique
 *   - Dependency references point to valid component IDs
 *   - Dependent-Component references point to valid component IDs
 *   - No circular dependencies (direct self-reference)
 *   - Entities within components have Id, Name, and at least one Attribute
 *
 * Usage:
 *   node validate-domain-model.js --file <path-to-components.yaml>
 *
 * Exit codes:
 *   0 — Valid (may have warnings)
 *   1 — Invalid (has errors)
 *   2 — Usage error
 */

const fs = require("fs");
const path = require("path");

// --- Minimal YAML parser for multi-document component files ---
// The components.yaml uses `---` as document separator and a nested structure.
// We parse it into an array of component objects.

function parseComponentsYaml(content) {
  // Split by document separator
  const docs = content.split(/^---\s*$/m).filter(d => d.trim().length > 0);
  const components = [];

  for (const doc of docs) {
    const component = parseComponentDoc(doc.trim());
    if (component) components.push(component);
  }

  return components;
}

function parseComponentDoc(text) {
  // Extract top-level fields from a single component document
  const component = {};
  const lines = text.split("\n");

  let currentKey = null;
  let currentList = null;
  let inEntities = false;
  let entityKey = null;

  for (const line of lines) {
    // Skip Component: wrapper line
    if (line.match(/^Component:\s*$/)) continue;

    // Top-level field (indented under Component:)
    const fieldMatch = line.match(/^\s{2}(\w[\w-]*):\s*(.*)$/);
    if (fieldMatch && !inEntities) {
      currentKey = fieldMatch[1];
      const value = fieldMatch[2].trim();

      if (value && value !== "[]") {
        component[currentKey] = value.replace(/^["']|["']$/g, "");
      } else if (value === "[]") {
        component[currentKey] = [];
      } else {
        component[currentKey] = [];
      }
      currentList = currentKey;
      continue;
    }

    // Handle Entities section specially
    if (line.match(/^\s{2}Entities:\s*$/)) {
      inEntities = true;
      component.Entities = {};
      continue;
    }

    if (inEntities) {
      // Entity ID line (e.g., "    ENT-001:")
      const entityIdMatch = line.match(/^\s{4}(\w[\w-]*):\s*$/);
      if (entityIdMatch) {
        entityKey = entityIdMatch[1];
        component.Entities[entityKey] = {};
        continue;
      }
      // Entity field (e.g., "      Name: ...")
      const entityFieldMatch = line.match(/^\s{6}(\w[\w-]*):\s*(.*)$/);
      if (entityFieldMatch && entityKey) {
        const val = entityFieldMatch[2].trim().replace(/^["']|["']$/g, "");
        if (val && val !== "[]") {
          component.Entities[entityKey][entityFieldMatch[1]] = val;
        } else {
          component.Entities[entityKey][entityFieldMatch[1]] = [];
        }
        continue;
      }
      // Entity attribute list item
      const entityListItem = line.match(/^\s{8}-\s*["']?(.+?)["']?\s*$/);
      if (entityListItem && entityKey) {
        const lastField = Object.keys(component.Entities[entityKey]).pop();
        if (lastField && Array.isArray(component.Entities[entityKey][lastField])) {
          component.Entities[entityKey][lastField].push(entityListItem[1]);
        }
        continue;
      }
      // If we hit a line at indent 2 or less, we're out of entities
      if (line.match(/^\s{0,2}\S/) && line.trim()) {
        inEntities = false;
        entityKey = null;
      }
    }

    // List items for Responsibilities, Boundaries, etc.
    const listItem = line.match(/^\s{4}-\s*["']?(.+?)["']?\s*$/);
    if (listItem && currentList && Array.isArray(component[currentList])) {
      component[currentList].push(listItem[1]);
      continue;
    }

    // Dependency/Dependent-Component nested items
    const depIdMatch = line.match(/^\s+Id:\s*(.+)$/);
    if (depIdMatch && (currentList === "Dependency" || currentList === "Dependent-Component")) {
      if (!Array.isArray(component[currentList])) component[currentList] = [];
      component[currentList].push(depIdMatch[1].trim());
    }
  }

  // Extract Id from the parsed fields
  if (component.Id) {
    return component;
  }

  return null;
}

// --- Validation Logic ---

function validate(components) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const allIds = components.map(c => c.Id).filter(Boolean);

  for (let i = 0; i < components.length; i++) {
    const c = components[i];
    const label = c.Id || `component[${i}]`;

    // Required fields
    if (!c.Id) {
      errors.push(`${label}: missing required field 'Id'`);
    }
    if (!c.Name) {
      errors.push(`${label}: missing required field 'Name'`);
    }
    if (!c["Behaviour-summary"]) {
      errors.push(`${label}: missing required field 'Behaviour-summary'`);
    }

    // Unique IDs
    if (c.Id) {
      if (ids.has(c.Id)) {
        errors.push(`${label}: duplicate component ID '${c.Id}'`);
      }
      ids.add(c.Id);
    }

    // Dependency references valid IDs
    if (Array.isArray(c.Dependency)) {
      for (const depId of c.Dependency) {
        if (depId === c.Id) {
          errors.push(`${label}: self-referencing dependency`);
        } else if (!allIds.includes(depId)) {
          warnings.push(`${label}: dependency '${depId}' not found in component list`);
        }
      }
    }

    // Dependent-Component references valid IDs
    if (Array.isArray(c["Dependent-Component"])) {
      for (const depId of c["Dependent-Component"]) {
        if (depId === c.Id) {
          errors.push(`${label}: self-referencing dependent-component`);
        } else if (!allIds.includes(depId)) {
          warnings.push(`${label}: dependent-component '${depId}' not found in component list`);
        }
      }
    }

    // Entities validation
    if (c.Entities && typeof c.Entities === "object") {
      for (const [entId, ent] of Object.entries(c.Entities)) {
        if (!ent.Name) {
          errors.push(`${label} → entity '${entId}': missing 'Name'`);
        }
        if (!ent.Attributes || (Array.isArray(ent.Attributes) && ent.Attributes.length === 0)) {
          warnings.push(`${label} → entity '${entId}': no attributes listed`);
        }
      }
    }

    // Should have at least one responsibility
    if (!c.Responsibilities || (Array.isArray(c.Responsibilities) && c.Responsibilities.length === 0)) {
      warnings.push(`${label}: no responsibilities listed`);
    }
  }

  return { errors, warnings };
}

// --- Main ---

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === "--file" && process.argv[i + 1]) {
    args.file = process.argv[++i];
  }
}

if (!args.file) {
  console.error("Usage: node validate-domain-model.js --file <path-to-components.yaml>");
  process.exit(2);
}

if (!fs.existsSync(args.file)) {
  console.log(JSON.stringify({ valid: false, errors: [`File not found: ${args.file}`], warnings: [] }));
  process.exit(1);
}

const content = fs.readFileSync(args.file, "utf-8");

// Basic YAML parse check
let components;
try {
  components = parseComponentsYaml(content);
} catch (e) {
  console.log(JSON.stringify({ valid: false, errors: [`YAML parse error: ${e.message}`], warnings: [] }));
  process.exit(1);
}

if (components.length === 0) {
  console.log(JSON.stringify({ valid: false, errors: ["No components found in file"], warnings: [] }));
  process.exit(1);
}

const { errors, warnings } = validate(components);

const result = {
  valid: errors.length === 0,
  componentCount: components.length,
  errors,
  warnings,
};

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
