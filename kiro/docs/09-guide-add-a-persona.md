# 9. Guide: Adding a Persona

## Steps

### 1. Create the persona YAML

```
src/personas/aidlc-<role>-agent.yaml
```

### 2. Write the persona

```yaml
name: aidlc-<role>-agent

description: >
  One line: who this persona is and what perspective they bring.

behaviour: |
  You are a [role] — [what you do and how you think].

  - [Core value/principle 1]
  - [Core value/principle 2]
  - [Core value/principle 3]
  - [What you care about most]
  - [What you push back on]

associated-skills:
  - aidlc-<skill-1>
  - aidlc-<skill-2>
```

### 3. Reference in stage definitions

Edit the relevant `stages/<stage>/definition.md` to list this persona as owner, contributor, or reviewer:

```markdown
## Owner
aidlc-<role>-agent

## Contributors
- aidlc-<role>-agent

## Reviewer
aidlc-<role>-agent
```

### 4. Run the build

```bash
npm run build
```

The build script:
- Parses the YAML
- Generates `.kiro/agents/aidlc-<role>-agent.json` with prompt, tools, and resources
- Automatically adds `common/` skills + associated skills to the `resources` array

### 5. Test

Start an intent where a stage lists this persona. Verify:
- It gets invoked as a sub-agent
- It behaves according to its `behaviour` section
- It applies its associated skills

## Persona YAML Fields

| Field | Required | What it does |
|-------|----------|-------------|
| `name` | Yes | Identifier used in stage definitions and state tracking |
| `description` | Yes | One-line summary (shown in agent panel) |
| `behaviour` | Yes | Personality, values, principles — defines HOW it thinks |
| `associated-skills` | No | List of skill names it loads (in addition to common skills) |

## Naming Convention

- Format: `aidlc-<role>-agent`
- Examples: `aidlc-product-manager-agent`, `aidlc-systems-architect-agent`, `aidlc-code-reviewer-agent`
- The role should describe the perspective, not the task

## Checklist

- [ ] YAML has name, description, behaviour
- [ ] Name follows `aidlc-<role>-agent` convention
- [ ] Behaviour defines perspective and values (not tasks)
- [ ] Associated skills exist in `src/skills/`
- [ ] Referenced in at least one stage definition
- [ ] Build passes
- [ ] Compiled JSON appears in `dist/kiro-ide/.kiro/agents/`
