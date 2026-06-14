# 3. When to Add a Stage?

## Add a Stage When

- There's a **distinct deliverable** that doesn't fit into any existing stage's outputs
- The work requires a **different persona** than what existing stages use
- The output has a **different audience** (e.g., infrastructure specs vs business requirements)
- Multiple intents keep needing the same intermediate step that currently gets done ad-hoc
- A team repeatedly asks for a particular kind of artifact before they can proceed

## Don't Add a Stage When

- The work is a **substep** of an existing stage (expand the existing stage's definition instead)
- It's a **one-off** for a single intent (handle it in composition as a custom addition)
- It's a **skill** rather than a deliverable (add a skill to an existing persona instead)
- It's a **validation check** (add it as a validation tool, not a stage)
- The existing stage could produce it with a different template

## Examples

| Situation | Stage or not? | Why |
|-----------|--------------|-----|
| "We need API contract specs between services" | ✅ Stage: `contract-design` | Distinct deliverable, specific persona, consumed by downstream stages |
| "We should check if the approach is technically feasible" | ❌ Skill: `aidlc-feasibility-skill` | It's expertise applied during composition/requirements, not a distinct output |
| "We need integration tests after all units are built" | ✅ Stage: `integration-test` | Distinct deliverable, runs after code-gen, verifies cross-unit contracts |
| "We want security review on every design" | ❌ Contributor role | Add a security persona as contributor to existing design stages |
| "We need Terraform for infrastructure" | ❌ Skill/template | The infra-design stage already exists; Terraform is a technology choice within it |

## The Smell Test

Ask: "Does this produce a named artifact that downstream stages consume?" If yes → stage. If no → probably a skill, contributor role, or template change.
