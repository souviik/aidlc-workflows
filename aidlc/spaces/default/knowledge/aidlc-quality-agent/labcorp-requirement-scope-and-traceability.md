# Requirement Scope and Traceability

Labcorp's test-scoping discipline, ported from Qai's Test Planner. This is the single biggest quality lever in our test-design process: every test case earns its place by tracing to something actually written in the requirement, and every stated requirement gets covered. Weigh this heavily when designing test cases and the traceability matrix during `build-and-test`.

## No Scope Creep

- **Single source of test ideas.** Derive every test case only from the requirement's stated Functional Requirements, Acceptance Criteria, and Test Data/Users. Do not invent user journeys, integrations, security sweeps, performance/load tests, full accessibility audits, or unrelated product areas that are not clearly required to validate those items.
- **No speculative or "creative" QA.** Do not add "nice to have," best-practice, or imagined scenarios (stress tests, rare browser combos, hypothetical abuse cases, full-app tours) unless the requirement's wording explicitly requires that behavior. If a test's narrative is not a direct reading of a stated requirement or acceptance criterion, omit it.
- **Reference context is non-authoritative.** Background context, linked-ticket narrative, and similar material are for traceability only — do not author tests solely from that narrative unless it ties to a specific, numbered requirement or acceptance criterion. Exception: explicitly listed test data/users (test accounts, patient/LPID/MRN identifiers) are authoritative for `test_data` — use every listed entity, and give each the same assertion depth (one test case per entity, or one Scenario Outline with one row per entity).
- **Techniques stay in-scope.** Apply EP, BVA, decision tables, state transitions, pairwise, etc. only for inputs, limits, rules, states, or workflows explicitly described in the requirement. Do not assume extra fields, APIs, roles, or business rules the requirement didn't state.
- **Error guessing / exploratory / checklists reinforce a stated requirement — they never introduce a new one.** Do not use them as a reason to introduce open-ended security or accessibility exploration ungrounded in the requirement text.
- **Consolidate when it fits.** Prefer one test case covering several requirements/criteria when one flow proves them together. Add more cases only when the requirement set is large, or distinct stated outcomes, branches, or data classes genuinely require separate scenarios.
- **Non-functional tests** (performance, compatibility, broad security, compliance-style) belong in the test plan only when the requirement — or an explicit non-functional clause — calls for measurable behavior. Otherwise omit them; that's `nfr-requirements`' job, not ad-hoc scope creep here.

## Test Case Volume Is Requirement-Driven, Not a Fixed Target

There is no maximum or "typical" case count to hit. Large requirement sets need more cases; small sets need few. Total case count must reflect actual coverage of the requirements — never an arbitrary target, and never padding to "showcase QA depth." A single test case may legitimately cover several acceptance criteria when one flow proves them together — use this to avoid redundant cases, not to paper over missing coverage of genuinely distinct outcomes.

## Boundary and Edge Case Discipline: Minimize by Default

- Favor positive/main-path cases and representative valid data. Treat Boundary and Edge Case categories as the exception, not the default — use them only when the requirement explicitly mentions numeric/date/length limits, min/max counts, timeouts, empty/full states, or other extreme behaviors to verify.
- Do not create separate cases for every boundary-1/boundary/boundary+1 combination unless the requirement text clearly calls for proving each limit. Prefer at most one focused boundary/invalid case per named limit — often folded as extra steps inside a broader functional case rather than a standalone "edge" case.
- Do not build an edge-case catalog ("cart with 0 items," "maximum integer," "Unicode stress") unless the same idea appears explicitly in the requirement.

## Traceability Discipline

- **Copy identifiers verbatim.** When a requirement/acceptance-criteria ID scheme already exists upstream (from `requirements-analysis` or `user-stories`), copy those exact ID strings into the test case's requirement/acceptance-criteria references and the traceability matrix. Never invent normalized IDs (e.g., don't fabricate `REQ-001` when the upstream artifact uses `FR-3` or a bare `AC2`) — mismatched IDs break traceability for anyone auditing coverage later.
- **Every stated requirement and acceptance criterion should appear on the traceability matrix and in at least one test case's references** — without inflating scope to manufacture that coverage artificially (see "No Scope Creep" above; coverage completeness and scope discipline are two sides of the same rule, not competing goals).
- **Test data and user identifiers** (test accounts, patient/LPID/MRN, fixture data) should be copied verbatim from wherever they're specified upstream into `preconditions`, `test_data`, and/or the test case title/objective — never substituted with placeholder data when specific values are provided.
