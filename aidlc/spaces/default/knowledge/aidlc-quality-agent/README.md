# Quality Agent Knowledge

Markdown files in this directory customize `aidlc-quality-agent` behavior for Labcorp projects.

Files here are loaded at step 8 of the knowledge loading order (per-agent `labcorp-*.md` layer), after framework methodology.

## Reading order

1. [labcorp-qa-stage-responsibilities.md](labcorp-qa-stage-responsibilities.md) — hub; QA role across all stages
2. [labcorp-test-plan-template.md](labcorp-test-plan-template.md) — seed at Stage **0.3**
3. [labcorp-release-process-template.md](labcorp-release-process-template.md) — seed at Stage **2.8**
4. [labcorp-release-qualification-record.md](labcorp-release-qualification-record.md) — per-release qualification / CHG handoff
5. [labcorp-test-automation-strategies.md](labcorp-test-automation-strategies.md) — automation reference during Construction and Stage **3.6**

## Automated testing (RAMP starter-pack adaptation)

For designing/writing automated test suites, these bundles cover web, mobile,
and pre-upgrade regression. The web and mobile files are **pointers** — the full
guidance lives in invokable skills (single source of record); invoke the skill
by name for the complete `references/` tree.

- [aidlc-web-test-automation.md](aidlc-web-test-automation.md) — web/E2E essence; **invoke the `aidlc-web-test-automation` skill** for full guidance (Playwright-first)
- [aidlc-mobile-test-automation.md](aidlc-mobile-test-automation.md) — mobile essence; **invoke the `aidlc-mobile-test-automation` skill** for full guidance (Maestro/Appium-first, AWS Device Farm)
- [regression-testing-strategy.md](regression-testing-strategy.md) — pre-upgrade tier strategy (Tier 1 API+E2E / Tier 2 pure logic / Tier 3 integration); full content, no skill peer

## Files in this directory

### Stage map and templates

- [labcorp-qa-stage-responsibilities.md](labcorp-qa-stage-responsibilities.md) — QA participation map across all 32 stages
- [labcorp-test-plan-template.md](labcorp-test-plan-template.md) — living artifact template for `<record>/quality/test-plan.md` (Stage **0.3**)
- [labcorp-release-process-template.md](labcorp-release-process-template.md) — living artifact template for `<record>/quality/release-process.md` (Stage **2.8** → **4.3**)
- [labcorp-release-qualification-record.md](labcorp-release-qualification-record.md) — living artifact template for `<record>/quality/release-qualification.md`

### Reference

- [labcorp-test-automation-strategies.md](labcorp-test-automation-strategies.md) — test pyramid, tooling, CI integration

### Automated-testing bundles (RAMP adaptation)

- [aidlc-web-test-automation.md](aidlc-web-test-automation.md) — pointer stub → `aidlc-web-test-automation` skill
- [aidlc-mobile-test-automation.md](aidlc-mobile-test-automation.md) — pointer stub → `aidlc-mobile-test-automation` skill
- [regression-testing-strategy.md](regression-testing-strategy.md) — full content; behavior-first tier strategy for pre-upgrade regression suites

## Living artifacts

| Template | Record path |
|----------|-------------|
| `labcorp-test-plan-template.md` | `<record>/quality/test-plan.md` |
| `labcorp-release-process-template.md` | `<record>/quality/release-process.md` |
| `labcorp-release-qualification-record.md` | `<record>/quality/release-qualification.md` |

## Related

- Deploy coordination (Stages **4.1–4.3**): [`../aidlc-pipeline-deploy-agent/labcorp-qa-release-coordination.md`](../aidlc-pipeline-deploy-agent/labcorp-qa-release-coordination.md)
- Related deploy coordination: [`../aidlc-pipeline-deploy-agent/labcorp-qa-release-coordination.md`](../aidlc-pipeline-deploy-agent/labcorp-qa-release-coordination.md)

**Tier 1 companions** (framework built-ins): `testing-guide.md`, `test-strategy-patterns.md`
