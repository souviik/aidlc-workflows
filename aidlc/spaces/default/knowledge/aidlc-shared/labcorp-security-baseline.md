# Labcorp Security Baseline

> **Layer**: cross-cutting (applies to both frontend and backend agents)
> **Source**: derived from `.cursor/rules/shared/snyk_rules.mdc` (in `ai-governance`)

Complements `../aidlc-devsecops-agent/labcorp-security-standards.md` (infra/ops) with the agent-time Snyk loop and secret-handling rules that apply during code generation.

## Snyk Scanning Loop

Every code generation event for first-party code in a Snyk-supported language must be followed by a Snyk scan. The loop is:

1. Generate or modify code.
2. Run the Snyk code scan tool against the changed files.
3. If issues are reported, fix them using the Snyk results context.
4. Re-scan to confirm the original issues are gone **and** no new issues were introduced by the fix.
5. Repeat from step 3 until the scan is clean.

The agent does not consider a unit of work complete while Snyk reports unresolved issues introduced or modified by this generation.

## Reporting

When a generation cycle ends with security issues that the agent could not auto-fix, the agent must surface them explicitly in the unit's completion summary, including the Snyk rule ID, file, line, and proposed remediation owner.
