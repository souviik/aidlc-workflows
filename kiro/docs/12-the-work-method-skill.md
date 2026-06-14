# 12. The Work-Method Skill (Deep Dive)

## Why It Exists

Every persona needs to know HOW to work through a stage — regardless of what domain expertise they bring. The work-method is that universal "how":

- How to plan
- How to ask questions
- How to produce artifacts
- How to contribute to someone else's work
- How to review
- How to refine based on feedback
- How to use the state-manager
- How to resolve templates
- How to respect depth

Without it, each persona would need its own execution instructions. The work-method centralizes this so persona files stay focused on identity and expertise.

## Where It Lives

```
src/skills/common/aidlc-work-method/SKILL.md
```

Because it's in `common/`, it's automatically loaded by every persona (the build script adds all `common/` skills to every agent's `resources` array).

## The State Contract

The work-method defines exactly which state transitions each actor makes and the tool commands to use. This is the contract between personas and the state-manager:

| Action | Transition | Actor | Command |
|--------|-----------|-------|---------|
| Wrote plan + questions | → `clarification-asked` | owner | `transition --to clarification-asked --actor owner` |
| Needs more answers | → `further-clarification` | owner | `transition --to further-clarification --actor owner` |
| Produced artifacts | → `artifact-generated` | owner | `register-output` then `transition --to artifact-generated --actor owner` |
| Contributed | (register only) | contributor | `register-contribution --persona <name>` |
| Refined after feedback | → `refined` | owner | `transition --to refined --actor owner` |
| Finalised after review | → `finalised` | owner | `transition --to finalised --actor owner` |

The orchestrator handles all other transitions (pending → plan-and-clarify, contribution-needed, presented, complete, etc.).

## Template Resolution (the priority chain)

When the work-method says "use templates":

```
1. org-ai-kb/<team>/memory/templates/<filename>   ← team custom (wins)
2. .kiro/stages/<stage>/templates/<filename>       ← framework default (fallback)
```

If neither exists, the persona produces output in a reasonable format based on the stage definition's `## Outputs` section.

## Depth Calibration

The work-method reads `workflow.json`'s `depth` field:

| Depth | How personas behave |
|-------|-------------------|
| `minimal` | Skip optional sections. One-liners where possible. Only what's needed to implement. |
| `standard` | All required sections. Rationale for decisions. Practical completeness. |
| `comprehensive` | Every section. Alternatives documented. Cross-references complete. Audit-ready. |

Personas don't ask "what depth?" — they read the workflow and calibrate.

## The Reviewer's Extended Flow

When a persona is invoked as reviewer, the work-method adds:

1. Read ALL files in the stage directory
2. Check if `## Validation Tools` exists in the stage definition
3. If yes: run each tool, include results in review
4. Write verdict: "ready" or "not ready" with specific gaps
5. Do NOT set state — the orchestrator handles that

The reviewer has judgment authority: a validation tool failure doesn't automatically mean "not ready." The reviewer decides if the failure matters.

## Modifying the Work-Method

Common changes:

| Change | Where to edit |
|--------|-------------|
| Add a new state transition | Add to the appropriate section + update `transitions.json` |
| Change template resolution order | Edit the "Persistence" section |
| Add a new action type | Add a new `### Action` section |
| Change how depth works | Edit the depth paragraph in "Persistence" |
| Change how reviewers use tools | Edit the "Final review" section |

**Rule:** changes to the work-method affect ALL personas. Test with multiple persona types before committing.
