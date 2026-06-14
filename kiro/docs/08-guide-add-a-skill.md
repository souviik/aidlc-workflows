# 8. Guide: Adding a Skill

## Steps

### 1. Create the skill directory

```
src/skills/<skill-name>/
└── SKILL.md
```

Naming convention: `aidlc-<domain>-skill` (e.g., `aidlc-feasibility-skill`, `aidlc-migration-skill`)

### 2. Write SKILL.md

```markdown
---
name: aidlc-<domain>-skill
description: |
  One-line description of what expertise this skill provides.
---

# Skill Name

## Definition

What this skill teaches the persona to do. One paragraph.

## When Applied

- When is this expertise relevant?
- Which stages would benefit from it?
- What triggers its use?

## Methodology / Dimensions / Patterns

The actual expertise content. Structure by:
- Assessment dimensions (for analytical skills)
- Patterns to apply (for design skills)
- Steps to follow (for procedural skills)
- Decision frameworks (for choice skills)

## Output Format

If this skill produces a specific artifact shape when applied:

```markdown
## [Section heading]
[What goes here]
```

## Principles

- Key principles that guide application of this skill
- Values and priorities
- What to optimize for
```

### 3. Attach to persona(s)

Edit `src/personas/<persona>.yaml`:

```yaml
associated-skills:
  - aidlc-<domain>-skill    # ← add here
```

### 4. Run the build

```bash
npm run build
```

The build script:
- Copies the skill to `dist/kiro-ide/.kiro/skills/`
- Adds it to the persona's `resources` array in the compiled agent JSON

### 5. Test

Invoke the persona in a stage where this skill applies. Verify it uses the skill's methodology (references the dimensions, follows the output format, applies the principles).

## Checklist

- [ ] SKILL.md has frontmatter with `name:` and `description:`
- [ ] Skill name follows `aidlc-<domain>-skill` convention
- [ ] Contains: Definition, When Applied, methodology content, Principles
- [ ] Attached to at least one persona via `associated-skills`
- [ ] Build passes

## Common vs Domain Skills

| Location | When |
|----------|------|
| `skills/common/<skill>/` | Loaded by ALL personas (work-method, prioritization) |
| `skills/<skill>/` | Loaded only by personas that declare it in `associated-skills` |

Common skills go in `common/` only if every persona needs them. Most skills are domain-specific.
