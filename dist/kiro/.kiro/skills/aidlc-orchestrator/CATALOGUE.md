# Skill Catalogue

Catalogue of AI-DLC skills. Each skill is a directory under `skills/<skill-name>/` and follows the [Agent Skills specification](https://agentskills.io/specification). The catalogue is the orchestrator's source when composing a workflow.

Skills come in three types:

- **Setup skills** — run once per intent during bootstrap, before the workflow exists. They create the intent skeleton and compose the workflow.
- **Stage skills** — run as discrete steps in the workflow. Each has its own clarification/planning/execution/validation cycle.
- **Lenses** — cross-cutting perspectives injected into every applicable stage's builder and validator invocations. They do not run as discrete steps.

Skills are composable. Phases and stages are organising concepts the orchestrator uses to group and present skills — they are not a rigid pipeline. A customer can reorder, insert, or omit any stage skill when composing a workflow.

## Skill folder layout

```
skills/<skill-name>/
├── SKILL.md              ← frontmatter (name, description, AI-DLC metadata) + instructions
├── validation-spec.md    ← validation rules + upstream inputs for the validator
└── scripts/              ← optional; omit if no scripts
```

Generic builder and validator behaviour lives in `aidlc-common/protocols/aidlc-builder-protocol.md` and `aidlc-common/protocols/aidlc-validator-protocol.md`. Per-skill folders only hold what differs between skills.

## Frontmatter metadata

Every skill's `SKILL.md` frontmatter carries, under `metadata`, the fields the orchestrator reads:

- `type` — `"stage"` (default), `"setup"`, or `"lens"`
- `phase` — `bootstrap`, `inception`, `construction`, or `operations` (stage and setup skills only)
- `stage` — organising tag (e.g. `requirements-analysis`, `user-stories`); multiple skills may share a stage when fan-out happens
- `per-unit` — `"true"` when the skill runs once per unit in the construction phase
- `human-clarification` — `"true"` (default) if the human answers clarification questions; `"false"` if the builder records the questions, picks its own recommended answers, and proceeds autonomously
- `plan-creation` — `"true"` (default) if the builder writes a plan file before execution; `"false"` if the skill skips planning entirely and goes from clarification straight to execution
- `plan-verification` — `"true"` (default) if the human approves the plan before execution. Ignored when `plan-creation: "false"`. Invalid combination: `plan-creation: "false"` with `plan-verification: "true"`.
- `artefact-verification` — `"true"` (default) if the human reviews artifacts after the validator passes
- `applies-to` — lenses only: `"all"` or a comma-separated list of stages where the lens is relevant
- `default-activation` — lenses only: `"true"` (active unless explicitly deactivated) or `"false"` (opt-in per intent)

Values are strings per the agentskills.io spec. The orchestrator parses `"true"`/`"false"` as booleans.

## Flag semantics

- `human-clarification: "true"` (default) — the builder writes clarification questions, the orchestrator presents them to the human, the human answers in chat or in the file, then the orchestrator hands the answers back to the builder. `"false"` — the builder writes the questions, picks its own recommended answers in the file (recording rationale), transitions clarification straight from `pending` through `answered` to `complete` in one builder pass, and proceeds. The human is not consulted.
- `plan-creation: "true"` (default) — the builder writes a plan file as an explicit step. `"false"` — the skill skips the planning step entirely; state goes from `clarification:complete` directly to `execution:pending`. No plan file is produced.
- `plan-verification: "true"` (default) — human approves the plan before the builder executes. `"false"` — builder proceeds without plan approval. Ignored when `plan-creation: "false"`.
- `artefact-verification: "true"` (default) — human reviews artifacts after the validator passes. `"false"` — validator pass = skill complete; human is only consulted on halting condition.

Clarification is always *attempted* — the questions file always exists for traceability — but the `human-clarification` flag controls whether the human is in the loop.

## Naming convention

All skills we supply are prefixed `aidlc-` to distinguish them from customer-contributed or third-party skills. The `stage` tag is the bare unprefixed name (e.g. `requirements-analysis`) and remains the human-facing vocabulary.

---

## Setup Skills

The bootstrap phase runs once per intent. The orchestrator drives `intent-bootstrap` outside `process_checker` (it has to — the file `process_checker` reads doesn't exist yet). After `intent-bootstrap` completes, the intent skeleton exists with a stub `workflow.md` containing only the `workflow-composition` line. From there, `workflow-composition` runs through the standard loop and rewrites `workflow.md` with the chosen downstream skills. Setup skills are never present in `workflow.md`.

Both setup skills set `human-clarification: false` and `plan-creation: false` because their decisions follow rote patterns: question files are auto-answered with the builder's recommendations (recorded for audit), planning is skipped, and execution proceeds directly. `workflow-composition` keeps `artefact-verification: true` so the human still approves the composed workflow.

| Skill | Stage | Human-Clar | Plan | Artefact-Verify | Status |
|---|---|---|---|---|---|
| aidlc-intent-bootstrap     | intent-bootstrap     | false | false | false | ✅ |
| aidlc-workflow-composition | workflow-composition | false | false | true  | ✅ |

---

## Stage Skills

Legend: ✅ implemented (folder exists under `skills/`), 🚧 not yet implemented.

Default flags (when not stated): `human-clarification: true`, `plan-creation: true`, `plan-verification: true`, `artefact-verification: true`.

| Skill | Phase | Per-Unit | Human-Clar | Plan-Create | Plan-Verify | Artefact-Verify | Status |
|---|---|---|---|---|---|---|---|
| aidlc-reverse-engineering   | inception    | No  | true | true | true | true | ✅ |
| aidlc-requirements-analysis | inception    | No  | true | true | true | true | ✅ |
| aidlc-user-stories          | inception    | No  | true | true | true | true | ✅ |
| aidlc-wireframes            | inception    | No  | true | true | true | true | ✅ |
| aidlc-application-design    | inception    | No  | true | true | true | true | ✅ |
| aidlc-units-generation      | inception    | No  | true | true | true | true | ✅ |
| aidlc-functional-design     | construction | Yes | true | true | true | true | ✅ |
| aidlc-nfr-assessment        | construction | Yes | true | true | true | true | ✅ |
| aidlc-nfr-design            | construction | Yes | true | true | true | true | ✅ |
| aidlc-infrastructure-design | construction | Yes | true | true | true | true | ✅ |
| aidlc-code-generation       | construction | Yes | true | true | true | true | ✅ |
| aidlc-build-and-test        | construction | No  | true | true | true | true | 🚧 |

The orchestrator or the human may override flags per-intent when composing the workflow.

When a skill is implemented, flip its Status to ✅ and ensure the folder contains `SKILL.md` and `validation-spec.md` at minimum.

---

## Lenses

Lenses are skills with `type: lens` that apply a perspective across the entire lifecycle. Unlike stage skills, lenses do not run as discrete steps in the workflow. Instead, they are activated during workflow-composition and their definitions are injected into every builder and validator invocation for the duration of the intent.

A lens provides:
- **Principles and definitions** — generic guidance the builder applies in context of whatever stage it is executing
- **Validation rules** — generic rules the validator checks against whatever artifacts it is validating

Lenses are composable and additive. Multiple lenses can be active simultaneously — they are independent perspectives on the same artifacts.

### Lens folder layout

```
skills/<lens-name>/
├── SKILL.md              ← type: lens, purpose, definitions, principles, question guidance
└── validation-spec.md    ← validation rules applied at every stage
```

### Activation

Lenses are activated or deactivated during `workflow-composition`. The activation decision is recorded in `intent-state.md` under a `## Active Lenses` section. Once activated, the lens's one-time clarification questions (from its Question Guidance) are asked as part of workflow-composition's clarification pass. Answers are stored in `bootstrap/workflow-composition/lens-<lens-name>-answers.md`.

### Runtime behaviour

- **Builder:** Before every builder invocation, the orchestrator includes each active lens's `SKILL.md` (definitions and principles) and its one-time answers. The builder interprets these in context of the current stage.
- **Validator:** Before every validator invocation, the orchestrator includes each active lens's `validation-spec.md`. The validator checks these rules alongside the stage skill's own validation-spec. Lens rule failures are real failures — same weight as stage-native rules.

Lens `validation-spec.md` files may organize rules into sections by stage applicability. The `### All Stages` section is checked everywhere; sections headed with a comma-separated stage list (e.g., `### application-design, functional-design, code-generation`) are checked only when the current stage matches. See `aidlc-common/protocols/aidlc-validator-protocol.md` for how the validator interprets sectional rules.

### Available lenses

| Lens | Applies To | Default Activation | Status |
|---|---|---|---|
| aidlc-owasp | all | true | ✅ |
