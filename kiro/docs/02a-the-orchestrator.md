# 2a. The Orchestrator

## What It Is

The orchestrator is the main agent — the only one that talks to the human. It drives development intents from start to finish by reading skills and invoking personas.

It lives at: `.kiro/skills/aidlc-orchestration/SKILL.md`

## What It Does

1. **Checks for active intents** — on activation, runs `state-manager.js check-resume` to offer resuming an in-progress workflow
2. **Kicks off new intents** — runs `workspace-setup.js` to create the directory skeleton
3. **Reads team memory** — loads preferences and corrections before composing
4. **Composes the workflow** — proposes stages one at a time, negotiates with the human
5. **Drives execution** — invokes persona sub-agents, manages transitions, presents gates
6. **Captures learnings** — the learnings hook fires after each sub-agent to record preferences

## What It Does NOT Do

- Does not produce artifacts — personas do that
- Does not judge quality — reviewers do that
- Does not write state.json directly — uses `state-manager.js`
- Does not write workflow.json directly — uses `workflow-manager.js`
- Does not answer domain questions — relays to appropriate persona

## Three Phases

The orchestrator operates in three phases, each defined by a separate skill:

| Phase | Skill | Purpose |
|-------|-------|---------|
| Kickoff | `aidlc-kickoff/SKILL.md` | Welcome, create workspace, set up intent |
| Composition | `aidlc-workflow-composition/SKILL.md` | Compose stages conversationally |
| Execution | `aidlc-stage-execution/SKILL.md` | Drive each stage through its cycle |

After each stage completes, it returns to Composition (not auto-advancing). This keeps the workflow adaptive.

## How It Invokes Personas

The orchestrator invokes personas as sub-agents with minimal context:

```
stage: <stage-name>
status: <current-status>
directory: <full-path-to-stage-directory>
```

That's all. The persona knows who it is. The work-method skill tells it what to do. The files in the directory provide context. No instructions, summaries, or file contents in the invocation.

## The Composition Flow

```
Step 1: Deduce intent category (internal reasoning)
Step 2: Apply learned preferences silently (read team memory)
Step 3: Surface integrations + ask about production/prototype
Step 4: State the high-level path casually
Step 5: Propose each stage with autonomy visible + options
Step 6: Reassess before every stage (adapt if complexity shifted)
```

Each proposal stops and waits for the human. After approval: template question → register in workflow.json + state.json → execute.

## The Execution Flow

```
1. Read stage definition.md
2. Verify inputs exist
3. Template check (ask human for format preferences)
4. Transition: pending → plan-and-clarify
5. Invoke owner persona
6. (Owner plans, clarifies, produces artifact)
7. If contributors: invoke all in parallel
8. If reviewer: invoke reviewer (runs validation tools)
9. Present to human (if supervised) or auto-advance
10. Transition to complete
11. Return to composition
```
