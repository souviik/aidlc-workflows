---
name: aidlc-feasibility-skill
description: |
  The skill of assessing technical feasibility — identifying constraints, blockers, unknowns, and risk before committing to a design path. Applied during workflow composition or early design stages when the orchestrator or architect needs to determine whether an approach is viable.
---

# Feasibility Assessment

## Definition

Evaluate whether a proposed technical approach is achievable given the constraints of time, technology, team capability, and external dependencies. Surface blockers early rather than discovering them during implementation.

## When Applied

- During workflow composition when the orchestrator asks "is this feasible?"
- During requirements analysis when a requirement implies technically challenging work
- During domain-design or infrastructure-design when an approach hasn't been validated
- Whenever the intent involves unfamiliar technology, complex integrations, or ambitious scale targets

## Assessment Dimensions

### 1. Technical Viability

- Can this be built with available technology?
- Are there proven patterns for this problem, or is it novel/research-grade?
- Are there hard technical limits (API rate limits, data size, latency physics) that block the approach?
- Does it require capabilities that don't exist yet (unreleased APIs, beta services)?

### 2. Integration Risk

- How many external systems must be integrated?
- Are APIs stable, documented, and accessible? Or undocumented/legacy/rate-limited?
- Are there authentication/authorization barriers to accessing dependencies?
- What happens if an external dependency is unavailable?

### 3. Data Feasibility

- Is the required data accessible? In what format? At what volume?
- Are there data quality issues that would block the approach?
- Are there privacy/compliance constraints on the data (PII, GDPR, HIPAA)?
- Can the data be migrated/transformed within the timeline?

### 4. Scale & Performance

- What are the expected load characteristics (users, requests/sec, data volume)?
- Does the approach scale to those characteristics without architectural redesign?
- Are there latency requirements that constrain the tech stack?
- What's the cost curve at scale?

### 5. Dependency & Ecosystem

- Are required libraries/frameworks actively maintained?
- Are there licensing constraints?
- Does the approach lock into a vendor or platform?
- What's the escape path if a key dependency fails?

## Output Format

When this skill is applied, produce a clear assessment:

```markdown
## Feasibility Assessment

**Verdict:** Feasible / Feasible with constraints / Not feasible as described

### Viable
- [what's straightforward]

### Constrained
- [what's achievable but has caveats, workarounds, or cost implications]

### Blocked
- [what cannot work as proposed — with the specific reason]

### Unknowns (need investigation)
- [what requires a spike, POC, or vendor conversation before committing]

### Recommendation
[What to do: proceed as-is, modify the approach, run a spike first, or descope]
```

## Principles

- A feasibility assessment is not a design — don't solve the problem, just confirm it's solvable
- "Feasible with constraints" is the most common honest answer — surface the constraints clearly
- Unknown ≠ infeasible. Flag unknowns as requiring investigation, not as blockers
- Always provide a recommendation — don't just list risks and leave the decision hanging
- Bias toward action: if something is probably feasible but unproven, recommend a time-boxed spike rather than blocking the whole workflow
