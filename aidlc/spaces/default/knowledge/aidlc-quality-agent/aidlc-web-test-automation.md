# Web Test Automation (team knowledge)

Automated web / end-to-end testing for the quality agent — greenfield and
brownfield. Extends the Tier 1 framework method in `test-strategy-patterns.md`
and `testing-guide.md`.

**Core principles (essence):**
- **Locators user-facing first** — `getByRole` / `getByLabel` / `getByText`,
  fall back to `getByTestId`; avoid CSS/XPath tied to DOM structure.
- **Web-first, auto-retrying assertions** — `await expect(locator).toBeVisible()`;
  **never fixed sleeps** (`waitForTimeout`, `cy.wait(<number>)`).
- **Test isolation** — each test independent; set up/reset in `beforeEach`; seed
  state via API or DB, not UI clicks; log in once and reuse `storageState`.
- **Scope discipline** — mock third-party/external services via network
  interception; don't hit real external servers.
- **Architecture** — Page Object Model for selectors, fixtures for setup/teardown;
  keep the test body thin.
- **CI** — run on every PR; shard for speed; `trace: 'on-first-retry'`; publish
  the HTML report + traces.
- **Default stack:** Playwright + TypeScript (Cypress/Selenium covered for
  existing investments and migration).

**→ For full guidance, invoke the `aidlc-web-test-automation` skill.** It carries the
complete `references/` set — locators, assertions/waiting/flakiness, POM &
fixtures, isolation & auth reuse, API testing & network mocking, accessibility
(axe-core) & visual regression, CI/parallelization, tool selection, and
Cypress/Selenium → Playwright migration. Do not duplicate that content here; the
skill is the source of record.

**Related team knowledge:** `regression-testing-strategy.md` (pre-upgrade tier
strategy), `labcorp-test-automation-strategies.md` (test pyramid, tooling, CI).
