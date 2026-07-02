# Operations Agent Knowledge

Markdown files in this directory customize `aidlc-operations-agent` behavior for Labcorp projects.

Files here are loaded at step 8 of the knowledge loading order (per-agent `labcorp-*.md` layer), after framework methodology.

## Files in this directory

- [labcorp-incident-response-playbook.md](labcorp-incident-response-playbook.md) — severity levels, PHI breach response, runbooks

## Related (quality agent)

| Topic | File |
|-------|------|
| Post-deploy smoke testing (Stage **4.3**) | [`../aidlc-quality-agent/labcorp-release-process-template.md`](../aidlc-quality-agent/labcorp-release-process-template.md) (§3.9) |
| Smoke test scope detail | [`../aidlc-quality-agent/labcorp-test-plan-template.md`](../aidlc-quality-agent/labcorp-test-plan-template.md) (§9) |
| QA vs deploy ownership | [`../aidlc-pipeline-deploy-agent/labcorp-qa-release-coordination.md`](../aidlc-pipeline-deploy-agent/labcorp-qa-release-coordination.md) |
