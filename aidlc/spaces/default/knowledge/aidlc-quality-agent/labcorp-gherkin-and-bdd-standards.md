# Gherkin and BDD Standards

Labcorp's BDD/Gherkin conventions, ported from Qai's Code Generation agent and `gherkin_best_practices.md`. Apply when generating `.feature` files, step definitions, or acceptance-test scenarios during `build-and-test` (or any stage producing BDD-style test artifacts).

## Feature Structure

1. **Feature title** — clear, descriptive, reflects business functionality.
2. **Feature description** — user story format (`As a... I want... So that...`).
3. **Background** — use for setup steps shared across every scenario in the feature. See the authentication exception below before defaulting to Background for login/token setup.
4. **Scenarios** — each scenario focuses on a single behavior or test case. Do not fold multiple unrelated behaviors into one scenario for the sake of fewer scenarios.

## Authentication and Access Tokens

- **Per-scenario token:** when scenarios involve different users, patients, or identities (e.g., different LPIDs, MRNs, or role types), obtain the access token **per scenario**, not once in `Background`. Sharing a token across scenarios that represent different identities silently masks authorization bugs.
- **Shared token:** when every scenario in the feature uses the same user/identity, a single `Background` token step is acceptable.

## Repository-First Discipline

Before writing new Gherkin, discover and follow the conventions the target repository already uses — do not invent a new step-writing style when one already exists.

1. Read one or more existing `.feature` files in the same product/service area (same service name, path prefix, or tag) before generating new scenarios.
2. Copy the exact `Given`/`And`/`When`/`Then` wording the repo already uses for setup concerns — token acquisition, content-type, base URL/client context, auth headers — and match its punctuation and step order (spaces after `And`, angle brackets vs. quotes for placeholders, etc.).
3. Insert that same setup prefix in every new scenario before the step that exercises the behavior under test.
4. Test data (identifiers, patient/LPID/MRN values, usernames) supplied by the requirement or test plan must appear in the feature file verbatim — in step text, scenario titles, or `Examples:` rows. Never substitute an invented placeholder when a specific value was provided.
5. If the repository has no comparable existing feature (rare), say so explicitly rather than silently inventing a convention, and align with whatever step-definition patterns do exist elsewhere in the repo.

**Conflict rule:** for setup/scaffolding lines (token, content-type, client binding), the repository's existing convention wins — match it exactly. For the actual behavior under test (HTTP method, request/response shape, business assertions), the requirement/test plan wins.

## Multi-Scenario Parity

When multiple test cases exercise the same underlying operation with different data (e.g., Patient A vs. Patient B, two different LPIDs), every such scenario must repeat the same assertion depth as the first scenario, in the same order — unless the test plan explicitly calls for reduced scope on that specific case (e.g., "sparse patient — no lab data; skip the lab-section assertion"). Do not quietly drop shared assertions from later scenarios just to shorten the feature file; if data may legitimately be missing for some cases, handle that with tolerant/conditional assertions inside the step definitions, not by omitting Gherkin steps.

## Framework-Specific Conventions

Bind generated code to exactly one framework per target stack — never mix libraries within a single generated artifact.

| Language | Framework | Use | Never mix in |
|---|---|---|---|
| Python | Behave | `from behave import given, when, then, step`; Playwright for browser automation | Selenium, `WebDriver`, `find_element(`, `By.*` |
| Java | Cucumber | Cucumber annotations; Selenium WebDriver for browser automation | Playwright imports (`com.microsoft.playwright`) |
| JavaScript | Cucumber-js | Cucumber-js step definitions; Playwright for browser automation | Selenium (`org.openqa.selenium`, `WebDriver`) |
| C# | SpecFlow / Reqnroll | Reqnroll bindings (the `TechTalk.SpecFlow` namespace is legacy — target `Reqnroll` unless the repo is still pinned to classic SpecFlow); Selenium for browser automation | Playwright (`Microsoft.Playwright`) |

Before generating code, confirm which framework the target repository actually uses (via the repository-first discovery above) rather than assuming a default — a mismatched framework produces code that will not compile or run against the existing suite.
