# 7. Guide: Adding a Stage

## Steps

### 1. Create the stage directory

```
src/stages/<stage-name>/
├── definition.md
└── templates/
    └── <output-filename>.md (or .yaml)
```

### 2. Write the definition.md

```markdown
# Stage Name

## Description

One paragraph: what this stage accomplishes. What it transforms (inputs → outputs).

## Inputs (any of)

- `<artifact>` from <upstream-stage> (what it needs to start)
- Or: intent.md (if it can start from raw intent)

## Outputs

- `<artifact-file>` — description of what this file contains

## Owner

<persona-name>-agent

## Contributors

- <persona-name>-agent (optional — remove section if no contributors)

## Reviewer

<persona-name>-agent (optional — remove section if no reviewer)

## Validation Tools

- `node .kiro/tools/<validator>.js --file <artifact>` (optional — only for machine-parseable outputs)
```

### 3. Create output templates

Put starter templates in `templates/`. These define the output format:
- Use markdown tables and diagrams for human-readable outputs
- Use YAML for machine-parseable outputs consumed by downstream stages
- Keep templates terse — "minimum structure, sections may be omitted with rationale"

### 4. Add to stage-graph.md

Add a row to the dependency table:

```markdown
| <stage-name> | <what it does> | <owner-persona> |
```

And add to the dependencies table:

```markdown
| <stage-name> | <what it can consume from> |
```

### 5. Run the build

```bash
npm run build
```

The build script copies stages to `dist/kiro-ide/.kiro/stages/`.

### 6. Test

Start a new intent. During composition, the orchestrator should detect when this stage is relevant and propose it. If it has upstream dependencies, those stages must produce their outputs first.

## Checklist

- [ ] `definition.md` has Description, Inputs, Outputs, Owner
- [ ] Templates exist for each output artifact
- [ ] Stage name is kebab-case and descriptive
- [ ] Stage is listed in `stage-graph.md` with dependencies
- [ ] Owner persona exists in `src/personas/`
- [ ] Build passes
