# 5. When to Add a Skill?

## Add a Skill When

- There's **domain expertise** that a persona needs across multiple stages
- The knowledge is **reusable** — not specific to one stage's output format
- It teaches **how to think** about a problem, not what to produce
- Multiple personas could benefit from the same expertise (shared skills in `common/`)
- A team repeatedly corrects the AI on methodology ("that's not how you do feasibility assessment")

## Don't Add a Skill When

- It's a **stage definition** (it describes what to produce, not how to think)
- It's a **template** (it defines output format, not methodology)
- It's a **tool** (it's deterministic logic, not expertise)
- It's a **convention** (it's a format rule, not domain knowledge)
- It only applies to **one stage** and is really just the stage instructions rephrased

## Examples

| Situation | Skill or not? | Why |
|-----------|--------------|-----|
| "How to assess technical feasibility" | ✅ Skill: `aidlc-feasibility-skill` | Reusable methodology applicable during composition, requirements, design |
| "How to write a requirements.md" | ❌ Stage definition + template | That's what the requirements-analysis stage definition describes |
| "How to detect team conventions from code" | ✅ Skill: `aidlc-practices-detection-skill` | Methodology applicable during reverse-engineering, potentially other stages |
| "How to format entities.yaml" | ❌ Template | The template file defines the format |
| "How to think about scalability" | ✅ Skill (part of `aidlc-solution-architecture-skill`) | Reusable thinking applicable to NFR design, infrastructure, code-gen |
| "How to validate YAML structure" | ❌ Tool: `validate-entities.js` | Deterministic check, not expertise |

## Skill vs Stage vs Template

| Concept | Answers | Example |
|---------|---------|---------|
| Stage | "What do I produce?" | `requirements.md` with functional and non-functional requirements |
| Skill | "How do I think about it?" | Requirements must be testable, traceable, and prioritized |
| Template | "What format does the output take?" | A markdown table with ID, Requirement, Acceptance Criteria columns |

## The Smell Test

Ask: "Is this knowledge that makes the persona BETTER at multiple stages, or is it instructions for ONE specific output?" If it makes them better broadly → skill. If it's instructions for one artifact → stage definition or template.
