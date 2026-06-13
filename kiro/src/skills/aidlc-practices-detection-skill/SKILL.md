---
name: aidlc-practices-detection-skill
description: |
  The skill of detecting team conventions from an existing codebase — branching strategy, test patterns, code style, dependency management, CI/CD approach, and architectural patterns. Applied during reverse-engineering to capture how the team works, so future stages respect those conventions.
---

# Practices Detection

## Definition

Extract team conventions, patterns, and preferences from the evidence in the codebase. Don't ask — observe. The code, config files, commit history, and CI setup tell you how this team works.

## When Applied

- During reverse-engineering of a brownfield codebase
- When the orchestrator needs to understand "how does this team work?" before composing a workflow
- When setting up `team-memory/preferences.md` for a new workspace

## What to Detect

### 1. Branching Strategy

Evidence sources: `.git` history, branch naming patterns, PR/MR templates, protected branch rules

Detect:
- Trunk-based vs feature-branch vs gitflow
- Branch naming convention (feature/, fix/, chore/)
- Typical branch lifespan (short-lived vs long-running)
- Merge strategy (squash, rebase, merge commit)

### 2. Testing Posture

Evidence sources: test directories, test frameworks in package manifest, test scripts, CI config, coverage config

Detect:
- Test framework (Jest, Vitest, pytest, JUnit, etc.)
- Test structure (co-located vs separate directory)
- Test types present (unit, integration, e2e, contract)
- Coverage tooling and thresholds
- Test naming conventions
- BDD/Given-When-Then patterns vs assertion-style

### 3. Code Style & Formatting

Evidence sources: linter config, formatter config, editorconfig, pre-commit hooks

Detect:
- Linter (ESLint, Biome, Pylint, etc.) and its rule set
- Formatter (Prettier, Black, gofmt, etc.)
- TypeScript strictness level
- Import ordering conventions
- Naming conventions (camelCase, snake_case, PascalCase for what)

### 4. Dependency Management

Evidence sources: lock files, package manifest, dependency update tooling

Detect:
- Package manager (npm, yarn, pnpm, pip, cargo, etc.)
- Lock file strategy (committed or not)
- Dependency update automation (Dependabot, Renovate)
- Monorepo tooling (nx, turborepo, lerna)

### 5. CI/CD Approach

Evidence sources: `.github/workflows/`, `buildspec.yml`, `Jenkinsfile`, `.gitlab-ci.yml`, `Makefile`

Detect:
- CI platform (GitHub Actions, CodeBuild, GitLab CI, Jenkins)
- Pipeline stages (lint, test, build, deploy)
- Environment strategy (dev, staging, prod)
- Deployment method (CDK, Terraform, serverless, containers)
- Approval gates in pipeline

### 6. Architectural Patterns

Evidence sources: directory structure, framework usage, dependency injection, API patterns

Detect:
- Architecture style (layered, hexagonal, clean, microservices, monolith)
- API style (REST, GraphQL, gRPC, event-driven)
- State management approach
- Error handling patterns (Result types, exceptions, error codes)
- Logging/observability patterns

## Output Format

Write detected practices to `team-memory/preferences.md` (if it exists) or include in the reverse-engineering output. Use this format:

```markdown
## Detected Practices

### Branching
- [observed strategy and evidence]

### Testing
- Framework: [name]
- Style: [BDD / assertion / property-based]
- Coverage: [threshold if configured]
- Location: [co-located / separate]

### Code Style
- Linter: [name + key rules]
- Formatter: [name]
- Strictness: [e.g., TypeScript strict: true]

### Dependencies
- Manager: [name]
- Monorepo: [yes/no, tooling]

### CI/CD
- Platform: [name]
- Stages: [what runs]
- Deploy: [method]

### Architecture
- Style: [observed pattern]
- API: [style]
- Error handling: [approach]
```

## Principles

- **Observe, don't assume.** Only report what you can point to in the codebase. If there's no linter config, say "no linter detected" — don't guess.
- **Evidence over inference.** For each detected practice, you should be able to point to a specific file or pattern that proves it.
- **Respect what exists.** The detected practices become constraints for code-generation. The goal is to match the team's style, not impose a new one.
- **Flag conflicts.** If evidence is contradictory (e.g., ESLint rules that conflict with Prettier config), surface it rather than picking a winner.
- **Don't prescribe.** This skill detects what IS, not what SHOULD BE. If the team has no tests, report "no tests detected" — don't add "you should have tests."
