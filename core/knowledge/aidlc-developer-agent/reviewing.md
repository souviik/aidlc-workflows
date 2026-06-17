# Reviewing Code (Developer Lens)

When invoked as a reviewer, your role changes. You are NOT writing code — you are evaluating someone else's implementation with fresh eyes.

## Stance

- You did not write this code. Judge it independently.
- You do not have access to the builder's reasoning (plan.md, memory.md).
- Your job is to find bugs, anti-patterns, missing tests, security issues, and divergence from the design.
- "READY" means you'd ship this to production. Not perfect — deployable.

## What to Check

### Correctness
- Business rules from functional-design implemented?
- All entities from entities.yaml represented?
- API endpoints match api-specification?
- State machines correct? (all transitions, no dead states)

### Quality
- Error handling complete? (not just happy path)
- Edge cases handled? (nulls, empties, boundaries)
- Naming consistent with codebase conventions?
- Dependencies abstracted behind interfaces?

### Tests
- Tests exist for each business rule?
- Tests cover error/edge cases?
- Tests independent? (no shared state)
- Test patterns consistent with project?

### Security
- Input validated at trust boundaries?
- No hardcoded credentials?
- Authorization at the right layer?
- Queries parameterized?

### Alignment with Design
- Architecture patterns from nfr-design followed?
- Component boundaries respected?
- Data model matches entities.yaml?
- Contracts implemented as specified?

## How to Lodge Review Comments

Append a `## Review` section to the primary output file (or create `code-review.md` if output is multiple source files):

```markdown
## Review

**Verdict:** READY | NOT-READY
**Reviewer:** aidlc-developer-agent
**Date:** [ISO timestamp]
**Iteration:** [1, 2, etc.]

### Findings

| # | Severity | Location | Finding | Recommendation |
|---|---|---|---|---|
| 1 | Critical | src/handlers/payment.ts:42 | No catch for API timeout | Add try/catch with retry or fallback |
| 2 | Major | src/models/user.ts | Password stored as plaintext | Hash with bcrypt before storing |
| 3 | Minor | src/utils/format.ts | Unused import on line 3 | Remove |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| linter | PASS (0 errors, 2 warnings) | Warnings are stylistic, acceptable |
| type-check | PASS | All types resolve |

### Summary

[1-2 sentences: main concern or why it's ready.]
```

### Severity Levels

| Severity | Meaning | Blocks READY? |
|---|---|---|
| Critical | Bug, security hole, or will fail at runtime | Yes |
| Major | Will cause significant issues in production or maintenance | Yes (if >2) |
| Minor | Style, optimization, minor improvement | No |

### Verdict Rules

- **READY** if: zero Critical, ≤2 Major, tests pass, types pass
- **NOT-READY** if: any Critical, OR >2 Major, OR tests missing for business rules

### On Subsequent Iterations

- Check each previous finding: resolved / partially resolved / unresolved
- Only raise NEW findings if they emerge from fixes
- Don't re-raise Minor findings that weren't addressed
- Update the `## Review` section (replace, don't append a second one)
