# 1. Principles Behind v2

## Core Philosophy

AI-DLC v2 is built on one principle: **LLMs own composition, tools own state.**

The LLM decides what to do (flexible, adaptive, conversational). Deterministic tools enforce that decisions are recorded correctly (robust, validated, traceable). This separation gives you flexibility without fragility.

## Design Principles

### 1. Composability Over Configuration

Workflows are composed conversationally at runtime, not configured upfront in a compiled graph. The human and orchestrator negotiate what stages to run, in what order, with what rigour — one stage at a time.

There are no scopes, no pre-defined paths, no "feature mode" vs "bugfix mode." The orchestrator right-sizes by reading the intent and proposing the shortest path. The human adjusts.

### 2. Many Front Doors

Different people think differently. A PM wants to start with requirements. A designer wants wireframes first. A developer wants to reverse-engineer existing code. All are valid entry points.

The stage dependency graph is a "can consume from" map, not a "must follow" sequence. Any stage can start from multiple inputs. The orchestrator respects the human's preferred order.

### 3. Skills Are Expertise, Stages Are Steps

A **stage** is a workflow step — a specific thing to produce (requirements, domain model, code). A **skill** is domain expertise — knowledge that a persona carries into any stage it participates in.

Skills are reusable across stages. A persona with `aidlc-feasibility-skill` can assess feasibility during requirements, during design, or during composition. The skill doesn't belong to a stage — it belongs to the persona.

### 4. Tool-Owned State, LLM-Owned Decisions

State transitions go through `state-manager.js` — which validates the transition is legal, the actor is authorized, and preconditions are met. The LLM decides *when* to transition; the tool ensures the transition is *valid*.

The LLM never writes `state.json` directly. This prevents hallucinated state, skipped transitions, and corrupted JSON.

### 5. Reviewers Use Judgment, Not Regex

Validation tools exist for machine-parseable artifacts (YAML schemas, cross-references). But they're invoked by the **reviewer persona** during its review — not as hooks that fire on every write.

The reviewer interprets results with context: "this validation failed but it's acceptable because we skipped that upstream stage." Sensors that blindly reject valid output are noise.

### 6. Team Memory Accumulates

Preferences, corrections, and templates persist in `org-ai-kb/<team>/memory/`. The learnings hook captures every user choice. Over time, the system learns how this team works — which stages they prefer autonomous, what output formats they use, what they never want to do.

No upfront configuration ceremony. The system starts blank and learns.

### 7. Workspace Over Project

The workspace is the anchor — not a single project/repo. `org-ai-kb/` sits above the code repos and tracks intents, knowledge, and preferences at the team level. Multiple repos, multiple intents, one workspace.

### 8. Documents for Humans, Data for Machines

Stage outputs explicitly separate human-readable summaries (markdown with diagrams and tables) from machine-readable sources of truth (YAML). Humans read `functional-spec.md`. The next stage reads `entities.yaml`. Don't make humans parse what's meant for machines.

### 9. Depth Is Conversational

No rigid depth/scope grid. The orchestrator proposes depth (Minimal/Standard/Comprehensive) based on the intent category. The human can override. The depth is recorded and personas calibrate their output accordingly.

### 10. Parallel Where Possible

Contributors invoke in parallel — not sequentially. When the architecture supports it (separate repos per unit), code-generation can parallelize too. Sequential only where order genuinely matters.
