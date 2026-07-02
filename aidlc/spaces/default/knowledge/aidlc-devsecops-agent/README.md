# DevSecOps Agent Knowledge

Markdown files in this directory customize `aidlc-devsecops-agent` behavior for Labcorp projects.

Files here are loaded at step 8 of the knowledge loading order (per-agent `labcorp-*.md` layer), after framework methodology.

## Files in this directory

- [labcorp-security-standards.md](labcorp-security-standards.md) — Okta, PHI/PII, encryption, breach notification
- [labcorp-ai-agent-security-standards.md](labcorp-ai-agent-security-standards.md) — AI agent security patterns
- [labcorp-agentcore-safety-standards.md](labcorp-agentcore-safety-standards.md) — AgentCore safety controls

## Related (quality agent)

| Topic | File |
|-------|------|
| Security scan gate before release regression | [`../aidlc-quality-agent/labcorp-release-process-template.md`](../aidlc-quality-agent/labcorp-release-process-template.md) (§3.6–§3.7) |
| Release qualification / CHG handoff | [`../aidlc-quality-agent/labcorp-release-qualification-record.md`](../aidlc-quality-agent/labcorp-release-qualification-record.md) |
