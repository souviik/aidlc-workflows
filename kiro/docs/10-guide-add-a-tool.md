# 10. Guide: Adding a Tool

## Steps

### 1. Create the tool file

```
src/tools/<tool-name>.js
```

Naming convention: `<verb>-<noun>.js` (e.g., `validate-entities.js`, `workspace-setup.js`)

### 2. Write the tool

```javascript
#!/usr/bin/env node
/**
 * <tool-name>.js — One-line description.
 *
 * Usage: node .kiro/tools/<tool-name>.js --<flag> <value>
 *
 * Exit codes:
 *   0 — Success
 *   1 — Validation failure / business error
 *   2 — Usage error (bad arguments)
 */

const fs = require("fs");
const path = require("path");

// --- Argument parsing ---
const args = {};
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i].startsWith("--") && process.argv[i + 1]) {
    args[process.argv[i].slice(2)] = process.argv[++i];
  }
}

// --- Validation ---
if (!args.requiredFlag) {
  console.log(JSON.stringify({ success: false, error: "Missing --requiredFlag" }));
  process.exit(2);
}

// --- Logic ---
// ... deterministic operations ...

// --- Output ---
console.log(JSON.stringify({ success: true, message: "Done", ...result }));
process.exit(0);
```

### 3. Design principles

1. **JSON output** — always `console.log(JSON.stringify(...))`. The LLM parses the response.
2. **Clear errors** — on failure, explain WHAT went wrong and HOW to fix it.
3. **No side effects outside scope** — a validator only reads, a state tool only writes state.json.
4. **Exit codes** — 0 = success, 1 = business failure, 2 = usage error.
5. **No dependencies** — pure Node.js, no npm packages, no external binaries.
6. **Fast** — milliseconds, not seconds. No network calls.

### 4. If it's a validator invoked by reviewers

Add a `## Validation Tools` section to the relevant stage definition:

```markdown
## Validation Tools

- `node .kiro/tools/<tool-name>.js --file <artifact> [--references <upstream-artifact>]`
```

### 5. If it's a state/workflow tool called by orchestrator/personas

Update the relevant skill to show the tool invocation:
- For orchestrator tools → update `aidlc-orchestration/SKILL.md` or `aidlc-workflow-composition/SKILL.md`
- For persona tools → update `common/aidlc-work-method/SKILL.md`

### 6. Run the build

```bash
npm run build
```

The build script copies `src/tools/` to `dist/kiro-ide/.kiro/tools/`.

### 7. Verify syntax

```bash
node --check src/tools/<tool-name>.js
```

### 8. Test

Run the tool manually with sample data. Verify:
- Happy path returns `{ success: true, ... }`
- Missing args returns `{ success: false, error: "..." }` with exit code 2
- Invalid input returns `{ success: false, error: "..." }` with exit code 1

## Checklist

- [ ] File is in `src/tools/`
- [ ] Has usage comment at the top
- [ ] Returns JSON on stdout
- [ ] Uses exit codes correctly (0/1/2)
- [ ] No npm dependencies
- [ ] `node --check` passes
- [ ] Referenced in a skill or stage definition
- [ ] Build copies it correctly
