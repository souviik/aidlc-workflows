# Mobile Test Automation (team knowledge)

Automated mobile app testing for the quality agent — native iOS, native Android,
React Native, and Flutter; greenfield and brownfield. Extends the Tier 1
framework method in `test-strategy-patterns.md` and `testing-guide.md`.

**Tool selection (essence):** RN → Detox or Maestro · Flutter → Maestro or
`integration_test` · native iOS → XCUITest · native Android → Espresso · one
shared cross-platform suite → Appium (more upkeep) or Maestro · PR smoke gate →
Maestro. Maestro is the rising modern default for E2E when there's no existing
investment.

**Core principles (essence):**
- **Locators = stable machine-facing IDs** — iOS `accessibilityIdentifier`,
  Android `resource-id`, RN `testID`; avoid XPath.
- **Synchronization** — never hard sleeps; lean on auto-syncing frameworks;
  disable system animations; stub the network; pre-grant permissions; enforce a
  known-clean start.
- **Device strategy** — emulators/simulators for the fast loop; validate
  hardware-dependent paths (sensors, camera, biometrics, GPS, payments) on real
  devices; build the matrix from your own user analytics.
- **Mobile concerns** — parameterized gesture APIs, deep links to jump to a
  screen, simulate network conditions, test app lifecycle (background/foreground,
  process death, upgrades).
- **CI & pyramid** — run on every push with animations off + devices reset;
  parallelize across a managed device cloud; many small tests, few E2E.

> ⚠️ **AWS Device Farm caveat:** its managed runner does **not** first-class
> Detox, Flutter, or Maestro (Espresso only as an Instrumentation test). Verify
> current supported frameworks and pricing via the **AWS Knowledge MCP** — never
> quote them from memory. BrowserStack / Sauce Labs are usually safer for the
> broadest framework + device coverage.

**→ For full guidance, invoke the `aidlc-mobile-test-automation` skill.** It carries
the complete `references/` set — tool selection, Appium setup, Maestro flows,
Detox/Flutter, Espresso/XCUITest, mobile flakiness, gestures/lifecycle/deep
links, device strategy, and device-farm CI. Do not duplicate that content here;
the skill is the source of record.

**Related team knowledge:** `regression-testing-strategy.md` (pre-upgrade tier
strategy), `labcorp-test-automation-strategies.md` (test pyramid, tooling, CI).
