# Labcorp Package Management

> **Layer**: cross-cutting (applies to both frontend and backend agents)
> **Source**: derived from `.cursor/rules/shared/angular-nest-monorepo.mdc` (in `ai-governance`)

## Workspaces

Exact versions only (no `^` / `~` ranges) in every `package.json` under `client/` and `server/`. Pin a new dependency in the workspace `package.json` where it is used. Do not add dependencies to the monorepo root unless they are tooling shared by both workspaces.

## AI-DLC Units of Work

- Commit the lockfile change in the **same unit** that adds or changes a dependency.
- Treat dependency upgrades as their **own unit of work** — do not bundle an upgrade with an unrelated feature change, which muddies the rollback story and obscures the cause of any regression.
