#!/usr/bin/env node
/**
 * validate-entities.js — Validates entities.yaml from the functional-design stage.
 *
 * Checks:
 *   - YAML parses correctly (multi-document)
 *   - Each entity has required fields: id, name, component-id, attributes
 *   - Entity IDs are unique
 *   - Each attribute has required fields: name, type, required
 *   - Relationship references point to valid entity IDs
 *   - component-id references exist in upstream components.yaml (if --references provided)
 *
 * Usage:
 *   node validate-entities.js --file <path-to-entities.yaml> [--references <path-to-components.yaml>]
 *
 * Exit codes:
 *   0 — Valid (may have warnings)
 *   1 — Invalid (has errors)
 *   2 — Usage error
 */

const fs = require("fs");
const path = require("path");

// --- Simple YAML array parser for entities ---
// entities.yaml is a list of objects separated by `---`

function parseEntitiesYaml(content) {
  const docs = content.split(/^---\s*$/m).filter(d => d.trim().length > 0);
  const entities = [];

  for (const doc of docs) {
    const entity = parseEntityDoc(doc.trim());
    if (entity) entities.push(entity);
  }

  return entities;
}

function parseEntityDoc(text) {
  const entity = { attributes: [], relationships: [], source: {} };
  const lines = text.split("\n");

  let context = "root"; // root, attributes, attribute, relationships, relationship, source
  let currentAttr = null;
  let currentRel = null;

  for (const line of lines) {
    const trimmed = line.trimEnd();

    // Skip list-item dash for top-level (indicates start of entity in a YAML list)
    if (trimmed.match(/^- id:/)) {
      const val = trimmed.replace(/^- id:\s*/, "").trim();
      entity.id = val;
      context = "root";
      continue;
    }

    // Root-level fields
    if (context === "root" || (context !== "attributes" && context !== "relationships" && !trimmed.match(/^\s{4,}/))) {
      const rootField = trimmed.match(/^\s{2}(\w[\w-]*):\s*(.*)$/);
      if (rootField) {
        const key = rootField[1];
        const val = rootField[2].trim().replace(/^["']|["']$/g, "");

        if (key === "attributes") {
          context = "attributes";
          continue;
        }
        if (key === "relationships") {
          context = "relationships";
          continue;
        }
        if (key === "constraints") {
          context = "constraints";
          continue;
        }
        if (key === "source") {
          context = "source";
          continue;
        }

        entity[key] = val;
        continue;
      }
    }

    // Attributes section
    if (context === "attributes") {
      // New attribute item
      if (trimmed.match(/^\s{4}- name:/)) {
        if (currentAttr) entity.attributes.push(currentAttr);
        currentAttr = {};
        currentAttr.name = trimmed.replace(/.*name:\s*/, "").trim().replace(/^["']|["']$/g, "");
        continue;
      }
      // Attribute fields
      const attrField = trimmed.match(/^\s{6}(\w[\w-]*):\s*(.*)$/);
      if (attrField && currentAttr) {
        currentAttr[attrField[1]] = attrField[2].trim().replace(/^["']|["']$/g, "");
        continue;
      }
      // End of attributes — new section
      if (trimmed.match(/^\s{2}\w/) && !trimmed.match(/^\s{4,}/)) {
        if (currentAttr) { entity.attributes.push(currentAttr); currentAttr = null; }
        context = "root";
        // Re-process this line
        const key = trimmed.match(/^\s{2}(\w[\w-]*):/);
        if (key) {
          if (key[1] === "relationships") { context = "relationships"; continue; }
          if (key[1] === "constraints") { context = "constraints"; continue; }
          if (key[1] === "source") { context = "source"; continue; }
          entity[key[1]] = trimmed.replace(/^\s{2}\w[\w-]*:\s*/, "").trim().replace(/^["']|["']$/g, "");
        }
        continue;
      }
    }

    // Relationships section
    if (context === "relationships") {
      if (trimmed.match(/^\s{4}- entity-id:/)) {
        if (currentRel) entity.relationships.push(currentRel);
        currentRel = {};
        currentRel["entity-id"] = trimmed.replace(/.*entity-id:\s*/, "").trim();
        continue;
      }
      const relField = trimmed.match(/^\s{6}(\w[\w-]*):\s*(.*)$/);
      if (relField && currentRel) {
        currentRel[relField[1]] = relField[2].trim().replace(/^["']|["']$/g, "");
        continue;
      }
      if (trimmed.match(/^\s{2}\w/) && !trimmed.match(/^\s{4,}/)) {
        if (currentRel) { entity.relationships.push(currentRel); currentRel = null; }
        context = "root";
        continue;
      }
    }
  }

  // Flush
  if (currentAttr) entity.attributes.push(currentAttr);
  if (currentRel) entity.relationships.push(currentRel);

  return entity.id ? entity : null;
}

// Extract component IDs from components.yaml (simple grep for Id: lines)
function extractComponentIds(content) {
  const ids = new Set();
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*Id:\s*(\S+)/);
    if (match) ids.add(match[1]);
  }
  return ids;
}

// --- Validation Logic ---

function validate(entities, componentIds) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const allEntityIds = entities.map(e => e.id).filter(Boolean);

  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    const label = e.id || `entity[${i}]`;

    // Required fields
    if (!e.id) {
      errors.push(`${label}: missing required field 'id'`);
    }
    if (!e.name) {
      errors.push(`${label}: missing required field 'name'`);
    }
    if (!e["component-id"]) {
      errors.push(`${label}: missing required field 'component-id'`);
    }

    // Unique IDs
    if (e.id) {
      if (ids.has(e.id)) {
        errors.push(`${label}: duplicate entity ID`);
      }
      ids.add(e.id);
    }

    // Attributes
    if (!e.attributes || e.attributes.length === 0) {
      errors.push(`${label}: must have at least one attribute`);
    } else {
      const attrNames = new Set();
      for (let j = 0; j < e.attributes.length; j++) {
        const attr = e.attributes[j];
        const attrLabel = `${label} → attribute[${j}]`;

        if (!attr.name) {
          errors.push(`${attrLabel}: missing 'name'`);
        } else {
          if (attrNames.has(attr.name)) {
            errors.push(`${attrLabel}: duplicate attribute name '${attr.name}'`);
          }
          attrNames.add(attr.name);
        }
        if (!attr.type) {
          errors.push(`${attrLabel}: missing 'type'`);
        }
        if (!attr.required) {
          warnings.push(`${attrLabel} ('${attr.name || "?"}'): missing 'required' field`);
        }
      }
    }

    // Relationship references
    for (const rel of e.relationships) {
      if (rel["entity-id"] && !allEntityIds.includes(rel["entity-id"])) {
        warnings.push(`${label}: relationship references entity '${rel["entity-id"]}' which is not in this file`);
      }
      if (!rel.cardinality) {
        warnings.push(`${label}: relationship to '${rel["entity-id"] || "?"}' missing 'cardinality'`);
      }
    }

    // Cross-reference component-id against upstream
    if (componentIds && e["component-id"] && !componentIds.has(e["component-id"])) {
      errors.push(`${label}: component-id '${e["component-id"]}' not found in upstream components.yaml`);
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
  console.error("Usage: node validate-entities.js --file <path> [--references <components.yaml>]");
  process.exit(2);
}

if (!fs.existsSync(args.file)) {
  console.log(JSON.stringify({ valid: false, errors: [`File not found: ${args.file}`], warnings: [] }));
  process.exit(1);
}

const content = fs.readFileSync(args.file, "utf-8");

let entities;
try {
  entities = parseEntitiesYaml(content);
} catch (e) {
  console.log(JSON.stringify({ valid: false, errors: [`YAML parse error: ${e.message}`], warnings: [] }));
  process.exit(1);
}

if (entities.length === 0) {
  console.log(JSON.stringify({ valid: false, errors: ["No entities found in file"], warnings: [] }));
  process.exit(1);
}

// Load upstream references if provided
let componentIds = null;
if (args.references && fs.existsSync(args.references)) {
  const refContent = fs.readFileSync(args.references, "utf-8");
  componentIds = extractComponentIds(refContent);
}

const { errors, warnings } = validate(entities, componentIds);

const result = {
  valid: errors.length === 0,
  entityCount: entities.length,
  errors,
  warnings,
};

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
