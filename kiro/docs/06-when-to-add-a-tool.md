# 6. When to Add a Tool?

## Add a Tool When

- The operation is **deterministic** — same input always produces same output
- The LLM would waste tokens or make errors doing it by hand (JSON manipulation, validation, file creation)
- It needs to be **fast** (milliseconds, not LLM inference time)
- It enforces a **constraint** that the LLM might forget or bypass
- Multiple stages or personas need the same operation

## Don't Add a Tool When

- The operation requires **judgment** (that's a skill or persona role)
- It's a **one-off** operation specific to one intent
- The LLM can do it reliably in-context (simple file writes, short text generation)
- It's **content creation** (tools validate and enforce; personas create)

## Examples

| Situation | Tool or not? | Why |
|-----------|-------------|-----|
| "Validate state.json has legal status values" | ✅ Tool: `state-manager.js validate` | Deterministic, fast, enforces constraint |
| "Create the intent directory skeleton" | ✅ Tool: `workspace-setup.js` | Deterministic, repetitive, error-prone by hand |
| "Check that entities.yaml IDs are unique" | ✅ Tool: `validate-entities.js` | Deterministic validation |
| "Write a requirements document" | ❌ Persona work | Requires judgment, domain knowledge |
| "Decide which stage comes next" | ❌ Orchestrator (LLM) | Requires context, human preferences, flexibility |
| "Read a file and summarize it" | ❌ Persona work | LLM capability |

## Existing Tools and Their Boundaries

| Tool | Does | Doesn't |
|------|------|---------|
| `state-manager.js` | Validates transitions, enforces preconditions, writes state atomically | Decide WHEN to transition (that's the persona/orchestrator) |
| `workflow-manager.js` | Writes approved stages to workflow.json | Decide WHICH stages to include (that's composition) |
| `workspace-setup.js` | Creates directory skeleton | Decide the intent slug (that's the orchestrator) |
| `validate-*.js` | Checks structural correctness | Judges quality (that's the reviewer persona) |

## The Smell Test

Ask: "Can this be a pure function with no ambiguity?" If yes → tool. If it requires interpretation, context, or judgment → skill/persona/LLM.

## Tool Design Principles

1. **JSON in, JSON out** — tools return `{ success: true/false, ... }` for the LLM to parse
2. **Clear error messages** — when it fails, tell the LLM exactly what's wrong and how to fix it
3. **No side effects beyond their declared scope** — `state-manager` writes state.json only, never workflow.json
4. **Idempotent where possible** — running the same command twice doesn't corrupt state
5. **No LLM dependency** — tools are pure Node.js, no API calls, no inference
