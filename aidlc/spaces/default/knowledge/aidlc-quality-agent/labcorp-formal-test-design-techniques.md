# Formal Test Design Techniques

Labcorp's test-design methodology, ported from Qai's Test Planner. Use these techniques to design test cases during `build-and-test` and when defining testable quality attribute scenarios in `nfr-requirements`. Select per requirement item — do not stack techniques that inflate case count without adding requirement coverage.

## Specification-Based Techniques (Black-Box)

### Equivalence Partitioning (EP)
**Use when:** Input has distinct valid/invalid ranges or categories.
Divide the input domain into partitions; test one representative value per partition. Reduces case count while maintaining coverage.
Example: Age field → `[<0 invalid]`, `[0-17 minor]`, `[18-65 adult]`, `[66+ senior]`, `[>150 invalid]`.

### Boundary Value Analysis (BVA)
**Use when:** the requirement explicitly defines numeric limits, date ranges, character limits, or array sizes.
Prefer one case (or extra steps in an existing case) hitting the minimum meaningful check the requirement demands. Avoid full boundary-1/boundary/boundary+1 grids unless the spec demands each point explicitly.

### Decision Table Testing
**Use when:** multiple conditions affect the outcome (complex business rules).
Build a table of all condition combinations and expected actions. Identifies rule variations and ensures complete logic coverage.
Example: Discount rules — membership type + cart value + promo code = discount %.

### State Transition Testing
**Use when:** the system has distinct states with defined transitions.
Map all states, transitions, and triggers. Test valid transitions (happy path) and invalid transitions (error handling); include state and transition coverage.
Example: Order lifecycle — Draft → Submitted → Approved → Shipped → Delivered, with cancellation paths.

### Use Case Testing
**Use when:** testing end-to-end user workflows.
Follow the main success scenario; cover alternative/exception paths only when they appear in the written requirement — do not enumerate hypothetical branches the requirement doesn't state. Validate pre- and post-conditions.

### Pairwise (All-Pairs) Testing
**Use when:** multiple input parameters create many possible combinations.
Tests all pairs of input parameters rather than the full combinatorial set — most defects come from 1-2 factor interactions.
Example: Browser (3) × OS (4) × Language (5) = 60 full combinations, ~15 pairwise tests.

### Cause-Effect Graphing
**Use when:** complex logical relationships exist between inputs and outputs.
Identify causes and effects, graph the AND/OR/NOT relationships, and derive test cases covering all logical paths.
Example: Login — `(valid_username AND valid_password) OR sso_token → access_granted`.

### Classification Tree Method
**Use when:** a visual, hierarchical approach to combinatorial testing is needed.
Identify test-relevant classifications and their classes; build a tree; combine classes systematically.
Example: User type (admin/user/guest) × Action (create/read/update/delete) × Data state.

## Experience-Based Techniques

### Error Guessing
**Use when:** leveraging tester intuition and historical defect patterns. Focus on null values, empty strings, special characters — but only to reinforce a stated requirement, never as license to introduce open-ended OWASP/WCAG-style sweeps not grounded in the extracted text.

### Exploratory Testing
**Use when:** discovering defects through simultaneous learning and testing. Effective for UI/UX and usability issues where the requirement describes an exploratory outcome — otherwise avoid.

### Checklist-Based Testing
**Use when:** ensuring standard quality criteria are met, using predefined checklists (accessibility, security, performance, compatibility) — only where the requirement calls for measurable behavior in that area.

## Risk-Based Techniques

### Risk-Based Testing
**Use when:** prioritizing effort by failure impact. Risk = probability of failure × impact of failure. Allocate more thorough testing to high-business-criticality areas (e.g., payment processing over a color theme).

## Negative and Edge Case Techniques

### Negative Testing
**Use when:** the requirement states invalid input, refusal, or error handling to verify. Use one negative path per distinct requirement clause describing invalid data or errors — do not enumerate every imaginable invalid input.

### Edge Case Testing
**Use when:** the requirement explicitly calls out extremes (empty list, max items, $0.01 total, timeout X seconds). Rare by default — if the spec does not name an extreme or limit, do not add edge-case tests "for thoroughness."

### Domain Analysis Testing
**Use when:** domain-specific constraints and rules apply. Collaborate with domain experts; test industry-specific scenarios and compliance requirements (e.g., healthcare data-handling rules, financial controls relevant to Labcorp's regulated context).

## Data-Driven Techniques

### Data-Driven Testing
**Use when:** the same test logic must run against multiple data sets. Separate test data from test logic; execute the same steps across input/output combinations without duplicating test cases.

## Technique Selection Guide

| Requirement Type | Recommended Techniques |
|---|---|
| Input validation | EP first; BVA / extra negatives only when the requirement names limits or required error behavior |
| Business rules | Decision Table, Cause-Effect |
| Workflows/processes | State Transition, Use Case |
| Multiple parameters | Pairwise, Classification Tree |
| Critical features | Risk-Based; Error Guessing only when tied to a stated requirement |
| Data processing | Data-Driven, Domain Analysis |
| User experience | Use Case; Exploratory only where the requirement describes an exploratory outcome |
| Error handling | Negative Testing per stated invalid rule; Edge Case only if the requirement names extremes |
