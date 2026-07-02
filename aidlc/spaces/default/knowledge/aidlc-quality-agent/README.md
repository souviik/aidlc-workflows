# Quality Agent Knowledge

Markdown files in this directory customize `aidlc-quality-agent` behavior for Labcorp projects.

Files here are loaded at step 8 of the knowledge loading order (per-agent `labcorp-*.md` layer), after framework methodology.

## Reading order

1. [labcorp-qa-stage-responsibilities.md](labcorp-qa-stage-responsibilities.md) — hub; QA role across all stages
2. [labcorp-test-plan-template.md](labcorp-test-plan-template.md) — seed at Stage **0.3**
3. [labcorp-release-process-template.md](labcorp-release-process-template.md) — seed at Stage **2.8**
4. [labcorp-release-qualification-record.md](labcorp-release-qualification-record.md) — per-release qualification / CHG handoff
5. [labcorp-test-automation-strategies.md](labcorp-test-automation-strategies.md) — automation reference during Construction and Stage **3.6**

## Files in this directory

### Stage map and templates

- [labcorp-qa-stage-responsibilities.md](labcorp-qa-stage-responsibilities.md) — QA participation map across all 32 stages
- [labcorp-test-plan-template.md](labcorp-test-plan-template.md) — living artifact template for `<record>/quality/test-plan.md` (Stage **0.3**)
- [labcorp-release-process-template.md](labcorp-release-process-template.md) — living artifact template for `<record>/quality/release-process.md` (Stage **2.8** → **4.3**)
- [labcorp-release-qualification-record.md](labcorp-release-qualification-record.md) — living artifact template for `<record>/quality/release-qualification.md`

### Reference

- [labcorp-test-automation-strategies.md](labcorp-test-automation-strategies.md) — test pyramid, tooling, CI integration

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
