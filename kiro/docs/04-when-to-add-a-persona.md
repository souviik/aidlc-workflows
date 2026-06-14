# 4. When to Add a Persona?

## Add a Persona When

- There's a **distinct perspective** that no existing persona covers (e.g., security, compliance, data engineering)
- Multiple stages need the same expertise as either owner, contributor, or reviewer
- The behaviour and values are genuinely **different** from existing personas (not just a different task)
- A team has a role that repeatedly provides input that doesn't fit any existing persona's stance

## Don't Add a Persona When

- An existing persona could handle it with an **additional skill** (add the skill, not the persona)
- It's the same perspective as an existing persona but for a **different stage** (personas are reusable across stages)
- It's a **tool function** (validation, compilation) — that's a tool, not a persona
- The distinction is only in **what** they produce, not **how they think** (same persona, different stage)

## Examples

| Situation | Persona or not? | Why |
|-----------|----------------|-----|
| "We need someone to review security posture" | ✅ Persona: `aidlc-security-reviewer-agent` | Distinct perspective — thinks in threats, attack vectors, compliance |
| "We need someone to do NFR design" | ❌ Existing persona + skill | `systems-architect` already owns this; add `solution-architecture-skill` |
| "We need a data engineer for ETL pipelines" | ✅ Maybe persona | If their perspective (data quality, pipeline reliability, schema evolution) is genuinely different from the systems-architect |
| "We need someone to write Terraform" | ❌ Skill on existing persona | `systems-architect` + `infrastructure-as-code-skill` |
| "We need a product lead to review requirements" | ✅ Persona: `aidlc-product-lead-agent` | Different stance from product-manager (reviews vs produces) |

## The Smell Test

Ask: "Does this role THINK differently, or just DO different things?" If they think differently (different values, different risk tolerance, different lens) → new persona. If they just do different work with the same lens → existing persona + new skill.

## Persona vs Role

A persona can play multiple roles:
- **Owner** in one stage (produces the artifact)
- **Contributor** in another (challenges someone else's work)
- **Reviewer** in another (quality-gates the output)

You don't need separate personas for "architect who designs" and "architect who reviews." One persona, different roles depending on the stage.
