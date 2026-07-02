# Change Summary — QA / Testing Skills Integration (v2.2.0)

**Date:** 2026-07-02
**Version bump:** `2.1.4` → `2.2.0` (minor / feature)
**Branch:** `feature/v2-quality-agent`

---

## 1. What & why

Equipped the `aidlc-quality-agent` with diverse automated-testing knowledge —
web/E2E, mobile, and pre-upgrade regression — for greenfield and brownfield
apps. Content was **imported (MIT-0)** from two AWS RAMP AI-DLC starter packs
(`qa-automated-testing`, `regression-software-testing`), which are authored for
**Kiro**, and reshaped to comply with this repo's Claude Code / multi-harness
architecture.

**Delivery model — dual-track, no content duplication:**

- **Tier 1 capability skills** (`core/skills/`) are the **single source of
  content** — native Agent Skills (`SKILL.md` + `references/`), invoked on demand
  via the `Skill` tool.
- **Tier 2 team knowledge** carries thin **pointer stubs** that make the quality
  agent aware of the skills and direct it to invoke them by name. No `references/`
  are copied into the knowledge tree.
- The **regression** bundle has no skill counterpart (it's reference, not a
  procedure), so it lands as full Tier 2 content.

---

## 2. New skills (Tier 1)

| Skill | Source pack | Content |
|-------|-------------|---------|
| `aidlc-web-test-automation` | qa-automated-testing | Playwright-first web/E2E: locators, flakiness, POM/fixtures, isolation/auth, API+network mocking, a11y+visual, CI/parallelization, tool selection, migration. `SKILL.md` + 10 references. |
| `aidlc-mobile-test-automation` | qa-automated-testing | Maestro/Appium-first mobile: tool selection, Appium/Maestro/Detox/Espresso/XCUITest, flakiness, device strategy, gestures/lifecycle/deep-links, AWS Device Farm CI. `SKILL.md` + 10 references. |

- Authored at `core/skills/aidlc-{web,mobile}-test-automation/`, `references/`
  structure preserved verbatim (the skill loader reads nested references).
- Named with the `aidlc-` prefix to match the framework's other capability
  skills (`aidlc-session-cost`, `aidlc-replay`, `aidlc-outcomes-pack`).
- **Not** stage/scope runners — they carry no `--stage … --single` marker, so
  the runner-gen drift guard never treats them as orphan runners.

**Explicitly NOT imported** (conflict with this repo's native engine): the packs'
Kiro `steering/*.md` workflow-enforcement files, `reverse-engineering.md`
(already a native stage), and `settings/mcp.json`.

---

## 3. New Tier 2 team knowledge

Under `aidlc/spaces/default/knowledge/aidlc-quality-agent/`:

| File | Role |
|------|------|
| `aidlc-web-test-automation.md` | Pointer stub → `aidlc-web-test-automation` skill (with core-principle essence for graceful degradation) |
| `aidlc-mobile-test-automation.md` | Pointer stub → `aidlc-mobile-test-automation` skill (incl. AWS Device Farm caveat) |
| `regression-testing-strategy.md` | Full content — behavior-first tier strategy (Tier 1 API+E2E / Tier 2 pure logic / Tier 3 integration), decision rules, anti-patterns, per-upgrade-path guidance. Kiro `inclusion: always` frontmatter stripped. |

The stubs reference the skill **by name** (harness-neutral — the Tier 2 tree gets
no `{{HARNESS_DIR}}` substitution), so they resolve identically on Claude Code,
Kiro, Kiro IDE, and Codex.

---

## 4. Files changed

### New files (115)

| Location | Count | Notes |
|----------|-------|-------|
| `core/skills/aidlc-{web,mobile}-test-automation/` | 22 | source of record (2 × [SKILL.md + 10 refs]) |
| `dist/claude/.claude/skills/…` | 22 | generated |
| `dist/kiro/.kiro/skills/…` | 22 | generated |
| `dist/kiro-ide/.kiro/skills/…` | 22 | generated |
| `dist/codex/.agents/skills/…` | 24 | generated — 22 + 2 `agents/openai.yaml` implicit-invocation guards |
| `aidlc/spaces/default/knowledge/aidlc-quality-agent/` | 3 | 2 pointer stubs + regression strategy |

_(This summary document is authored separately and not counted above.)_

### Modified files (17)

**Wiring (harness surfaces):**
- `harness/claude/manifest.ts`, `harness/kiro/manifest.ts`, `harness/kiro-ide/manifest.ts` — added two `coreDirs` rows for the new skills.
- `harness/codex/emit.ts` — added both skill names to the hardcoded skill-emission list (Codex has no `coreDirs`; without this the Tier 2 pointer would dangle on Codex). Comment expanded to explain the requirement.

**Version / changelog (all bumped to 2.2.0, pinned by `t68`):**
- `core/tools/aidlc-version.ts` (+ 4 regenerated `dist/*/tools/aidlc-version.ts` copies)
- `CHANGELOG.md` — new `## [2.2.0]` entry
- `README.md` — version badge + repo-layout tree comment

**Documentation:**
- `docs/guide/17-skills.md` — new "Capability skills" bullet
- `docs/reference/17-skill-system.md` — skill-set enumeration
- `docs/reference/01-architecture.md` — `core/` tree comment
- `docs/harness-engineering/09-porting-to-a-new-harness.md` — coreDirs note
- `aidlc/spaces/default/knowledge/aidlc-quality-agent/README.md` — reading-order + file listing

**Tests:**
- `tests/smoke/t123-skills-spec-conformance.test.ts` — added `CAPABILITY_SKILLS` to the derived expected set (38 → 40 skills)
- `tests/unit/t123-skills-spec-conformance.test.ts` — same
- `tests/unit/t150-codex-packaging.test.ts` — Codex skill-dir count 38 → 40

---

## 5. How the quality agent uses it

- **Ambient** (Tier 2 stub): auto-loaded at every quality-led stage (e.g.
  `build-and-test`, 3.6) — the agent learns the skill exists and holds the
  core-principle essence.
- **Procedural** (the skill): invoked via the `Skill` tool for the full
  `references/` set via progressive disclosure.
- Complements the existing **test-strategy state field**
  (Minimal/Standard/Comprehensive): that sets test *volume*, this sets
  *technique*. No stage, scope, sensor, agent, or runner was changed — additive
  only.

---

## 6. Verification (all green)

| Check | Result |
|-------|--------|
| `bun scripts/package.ts --check` (drift, all 4 harnesses) | ✅ in sync |
| `aidlc-runner-gen.ts check` (runner drift guard) | ✅ 29 runners, skills not flagged |
| `t68` version ⇄ CHANGELOG ⇄ README badge | ✅ 7/0 |
| `t123` smoke (skill-set conformance) | ✅ 201/0 |
| `t123` unit | ✅ 121/0 |
| `t150` Codex packaging parity | ✅ 8/0 |
| Skills present in all 4 dist trees (incl. Codex `.agents/skills/`) | ✅ 10 references each |

**Note on pre-existing failures:** the full unit tier shows ~16 other failing
files (t84, t11, t07, t146, t156, gen-coverage-registry, etc.). Verified by
stashing this entire change and re-running — **they fail identically on clean
HEAD**. They are pre-existing artifacts of this local Windows checkout (CRLF line
endings breaking `^---\n` regexes/byte-diffs; timing tests exceeding millisecond
budgets; git-worktree tests). They resolve to LF on commit / Linux CI and are
**not caused by this work**.

---

## 7. Upgrade note (for users)

Re-copy your `dist/<harness>/` shell into the project to pick up the two new
skills. No workflow, stage, scope, or state changes. No breaking changes.
