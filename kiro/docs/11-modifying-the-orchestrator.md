# 11. Modifying the Orchestrator

## What You're Changing

The orchestrator is defined by three skills:

| Skill | Controls | File |
|-------|----------|------|
| `aidlc-orchestration` | Entry point, phase routing, team memory reading, session resume | `skills/aidlc-orchestration/SKILL.md` |
| `aidlc-workflow-composition` | How stages are proposed, approved, and registered | `skills/aidlc-workflow-composition/SKILL.md` |
| `aidlc-stage-execution` | How stages are driven through their state cycle | `skills/aidlc-stage-execution/SKILL.md` |

## Common Modifications

### Adding a new step to composition

Edit `aidlc-workflow-composition/SKILL.md`. The steps are numbered. Insert your step and renumber. Each step should clearly state:
- What the orchestrator does
- Whether it stops and waits for the human
- What the output is (a decision, a tool call, etc.)

### Changing what happens at stage start/end

Edit `aidlc-stage-execution/SKILL.md`. The "Sequencing" section defines the per-stage flow. The state machine table defines valid transitions.

### Adding a new autonomy mode

1. Add to the autonomy table in `aidlc-stage-execution/SKILL.md`
2. Add to the enum in `conventions/workflow-schema.json`
3. Add to the mode reference table in `aidlc-workflow-composition/SKILL.md`
4. Define which gates block and which auto-advance for the new mode

### Changing how preferences are read/written

Edit `aidlc-workflow-composition/SKILL.md` Step 2 (Apply Learned Preferences) for reading. Edit the learnings hook (`target-config/kiro-ide/hooks/learnings-prompt.kiro.hook`) for writing.

### Adding a new tool call to the orchestrator flow

1. Create the tool in `src/tools/`
2. Add the invocation instruction to the relevant skill (composition or execution)
3. Show the exact command syntax with all required flags

## Rules for Modifying Orchestrator Skills

1. **Be explicit** — the LLM follows exactly what you write. Vague instructions get vague behavior.
2. **Show the tool command** — if a tool should be called, write the full `node .kiro/tools/... --flag value` command in the skill.
3. **State when to STOP** — if the human should respond before continuing, write "STOP HERE. Wait for the human."
4. **One instruction per action** — don't bundle multiple behaviors in one paragraph.
5. **Use MUST/NEVER for hard rules** — "MUST read stage-graph.md", "NEVER skip the template question"
6. **Use examples** — show what the output looks like, not just describe it.
7. **Test by running an intent** — the only way to verify orchestrator changes is to run through a workflow.

## What NOT to Put in Orchestrator Skills

- Domain expertise (that's a persona skill)
- Output templates (that's in `stages/<stage>/templates/`)
- State validation logic (that's in `state-manager.js`)
- Folder structure rules (that's in `conventions/folder-structure.md`)

The orchestrator skills define **flow** and **interaction patterns** — not content, validation, or format.
