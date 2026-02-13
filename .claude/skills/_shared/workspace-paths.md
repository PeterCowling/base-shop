# Workspace Path Policy

Canonical path resolution for feature workspaces and stage-doc API keys.
All workflow skills (`/lp-fact-find`, `/lp-plan`, `/lp-build`, `/lp-replan`, `/lp-sequence`) MUST follow this policy.

## 1) Feature Workspace Layout

New work uses directory-based workspaces:

```
docs/plans/<slug>/
  fact-find.md          # lp-fact-find brief
  plan.md               # lp-plan document
  replan-notes.md       # lp-replan notes (optional)
  design-spec.md        # lp-design-spec (optional)
  design-qa-report.md   # lp-design-qa (optional)
```

**Rules:**
- `<slug>` is kebab-case, derived from the card's `Feature-Slug` frontmatter field (or from the feature title if no card exists).
- Skills MUST write to the canonical directory path. Writing directly to the legacy flat path is **prohibited**.
- The workspace directory MUST be created before writing the first artifact (`mkdir -p docs/plans/<slug>/`).

## 2) Legacy Flat-Path Aliases (Migration)

Legacy plans use flat paths:

```
docs/plans/<slug>-fact-find.md       (legacy)
docs/plans/<slug>-plan.md            (legacy)
docs/plans/<slug>-replan-notes.md    (legacy)
```

### Resolution Algorithm

When **reading** a workspace artifact:

1. Try canonical path first: `docs/plans/<slug>/plan.md`
2. If not found, try legacy alias: `docs/plans/<slug>-plan.md`
3. If neither exists, the artifact does not exist.

When **writing** a workspace artifact:

1. Always write to canonical path: `docs/plans/<slug>/plan.md`
2. **NEVER** write to the legacy flat path.
3. If a legacy file exists and you need to update it, **migrate first**: move it to the canonical path, then update.

### Alias Map

| Artifact | Canonical Path | Legacy Alias (read-only) |
|----------|---------------|--------------------------|
| Fact-find brief | `docs/plans/<slug>/fact-find.md` | `docs/plans/<slug>-fact-find.md` |
| Plan document | `docs/plans/<slug>/plan.md` | `docs/plans/<slug>-plan.md` |
| Replan notes | `docs/plans/<slug>/replan-notes.md` | `docs/plans/<slug>-replan-notes.md` |
| Design spec | `docs/plans/<slug>/design-spec.md` | `docs/plans/<slug>-design-spec.md` |
| Design QA report | `docs/plans/<slug>/design-qa-report.md` | `docs/plans/<slug>-design-qa-report.md` |

### Write Blocking

If a skill attempts to write to a legacy flat path (`docs/plans/<slug>-plan.md`), it MUST:
1. STOP the write.
2. Report the error: `"Write blocked: use canonical path docs/plans/<slug>/plan.md instead of legacy path docs/plans/<slug>-plan.md"`.
3. Create the workspace directory and write to the canonical path instead.

## 3) Stage-Doc API Key Policy

When calling the BOS Agent API for stage documents, use these canonical stage keys:

| Stage | Canonical API Key | Rejected Aliases |
|-------|-------------------|------------------|
| Fact-finding | `fact-find` | `lp-fact-find` |
| Planned | `plan` | `planned`, `lp-plan` |
| Build | `build` | `lp-build` |
| Reflect | `reflect` | `lp-reflect` |

**Rules:**
- Skills MUST use the canonical key when **creating or updating** stage docs via the Agent API.
- The Agent API may accept aliases for backward compatibility, but skills must not rely on this.

## 4) Card Frontmatter Path References

When updating card frontmatter fields that reference plan paths:

| Field | Value Format |
|-------|-------------|
| `Plan-Link` | `docs/plans/<slug>/plan.md` |
| `Feature-Slug` | `<slug>` (kebab-case) |

Legacy cards may have `Plan-Link: docs/plans/<slug>-plan.md`. Skills reading this field should follow the resolution algorithm (try canonical first, then legacy).

## 5) Fast-Path Resolution

When a skill receives a slug argument (e.g., `/lp-build my-feature`):

1. Resolve to canonical workspace: `docs/plans/my-feature/plan.md`
2. If not found, try legacy: `docs/plans/my-feature-plan.md`
3. If neither exists, report the artifact as missing.

## 6) Briefing Notes (Non-Plan Artifacts)

Understanding-only lp-fact-find outputs (Outcome B) use a separate path:

```
docs/briefs/<topic-slug>-briefing.md
```

These are NOT workspace artifacts and are not affected by this policy.

## Related Resources

- Stage doc operations: `.claude/skills/_shared/stage-doc-operations.md`
- Card operations: `.claude/skills/_shared/card-operations.md`
- Loop spec: `docs/business-os/startup-loop/loop-spec.yaml`
