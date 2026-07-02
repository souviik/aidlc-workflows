# API Test Conventions

Labcorp's conventions for HTTP/API-level BDD test generation, ported from Qai's API Code Generation agent. Apply when the unit under test is a REST/HTTP API rather than a browser-driven UI flow.

## HTTP Fidelity

- Use the exact HTTP method and path specified by the test plan/requirement (endpoint resolution should already have followed a requirements-first, then API-spec, priority upstream — do not invent or "correct" a different operation here).
- Never normalize a method to make the test easier to write (e.g., do not turn a `POST` into a `GET` because the scenario conceptually "reads" data).
- If the plan specifies a request body or JSON payload, the steps and step-definition code must actually send a body — not fall back to query-string-only calls.

## No Browser Automation

API test generation never uses Playwright, Selenium, WebDriver, or Puppeteer — no UI locators, no `Page` object, no element clicks. Generate HTTP-client code instead: Python `requests`/`httpx`, Java Rest Assured, JavaScript `fetch`/axios, or C# `HttpClient`/RestSharp — matching whatever HTTP client style the target repository already uses.

## Repository-First Feature Shape (Non-Negotiable)

Many Labcorp API repos establish a fixed prefix of setup steps before any endpoint call (e.g., token acquisition, content-type configuration). Discover and reuse that exact convention rather than inventing one:

1. Read one or more existing `.feature` files in the same API product area (same service name, path prefix, or tag as the test plan) before writing new scenarios.
2. Copy the exact `Given`/`And` lines the repo uses for token acquisition, content-type, and base client context, and insert that same prefix in every new scenario before the step that hits the endpoint under test.
3. Match `Examples:` placeholder conventions and data shape already used in the repo.
4. Never jump straight to an action step (e.g., "I send POST request to...") if the repository's existing scenarios in that area always show setup steps first.
5. Test data (identifiers, patient/LPID/MRN values) from the requirement or test plan must appear in the feature file exactly as given — never substituted with invented placeholders.

**Conflict rule:** the repository's existing convention wins for setup/scaffolding lines (token, content-type, client binding) — match it exactly, including punctuation and step order. The test plan wins for the behavior under test itself (HTTP method, path, request body vs. query params, expected status/response assertions).

## Multi-Scenario Parity

When several test cases exercise the same API operation with different data (e.g., two different patients/LPIDs), every scenario must repeat the same post-condition assertion depth as the first — same structural checks, same field checks — in the same order, unless the test plan explicitly calls for reduced scope on that specific case. If real data may legitimately be sparse or missing for some cases, implement tolerance inside the step definitions (conditional/soft assertions), not by silently dropping Gherkin assertion steps from later scenarios. A `Scenario Outline` with varying `Examples` data should keep one consistent template — never a second, thinner outline for "the second data set."
