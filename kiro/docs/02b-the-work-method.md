# 2b. The Work Method Skill

## What It Is

The work-method is the universal skill that teaches every persona HOW to work through a stage. It lives at: `.kiro/skills/common/aidlc-work-method/SKILL.md`

Every persona loads it automatically (it's in `common/`). It defines the actions a persona can be asked to perform and exactly how to perform them.

## The Actions

| Action | When the persona is... | What it does |
|--------|----------------------|-------------|
| Plan and clarify | The owner, starting fresh | Writes `questions.md` + `plan.md`, transitions to `clarification-asked` |
| Review answers | The owner, after human answered | Reads answers, decides proceed or ask more |
| Produce artifacts | The owner, with clear answers | Follows plan, writes outputs, registers them, transitions to `artifact-generated` |
| Contribute | A contributor to someone else's stage | Reads the artifact, writes `<persona>-contribution.md` |
| Final review | The reviewer | Reads everything, runs validation tools if listed, writes verdict |
| Refine | The owner, after contributor feedback | Addresses findings, updates artifacts |
| Finalise | The owner, after reviewer feedback | Addresses review findings, updates artifacts |

## State Transitions Are Tool Calls

The work-method instructs personas to use `state-manager.js` for ALL state changes:

```bash
# Register an output before claiming artifact-generated
node .kiro/tools/state-manager.js register-output \
  --intent <dir> --stage <name> --name <file> --location <path/>

# Transition after producing artifacts
node .kiro/tools/state-manager.js transition \
  --intent <dir> --stage <name> --to artifact-generated --actor owner
```

Never write `state.json` directly. The tool validates and rejects illegal transitions.

## Template Resolution

When producing artifacts, the persona checks for templates in this order:

1. `org-ai-kb/<team>/memory/templates/<filename>` — team custom (wins if exists)
2. `.kiro/stages/<stage>/templates/<filename>` — framework default (fallback)

## Depth Awareness

Personas read the `depth` field from `workflow.json` and calibrate output:

| Depth | What it means |
|-------|--------------|
| Minimal | Bare minimum to move forward. Skip optional sections. Be terse. |
| Standard | Practical thoroughness. Cover all required sections with rationale. |
| Comprehensive | Full ceremony. Every section, alternatives documented, complete traceability. |

## Persistence Rules

- Everything gets written to disk — nothing stays only in chat
- Read and follow `conventions/` for folder structure and formats
- When refining a previous artifact, copy it forward and expand in place (preserve stable IDs)
- Never return content only in chat — write to disk first
- Read files directly from the file system — don't rely on the orchestrator to pass contents

## The Reviewer's Extra Step

When reviewing, if the stage definition has a `## Validation Tools` section:

1. Run each listed tool against the relevant artifact
2. Include results in the review
3. Interpret with judgment — explain what failed and whether it matters
4. A validation failure doesn't automatically mean "not ready" — the reviewer decides
