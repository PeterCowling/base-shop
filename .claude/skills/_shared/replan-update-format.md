# Replan Update Format

Default to compact in-task delta blocks (3-6 lines). Put deep evidence in `replan-notes.md` when needed.

## In-Task Delta (compact)

```markdown
#### Re-plan Update (YYYY-MM-DD)
- Confidence: <old>% -> <new>% (Evidence: E1/E2/E3)
- Key change: <one-line decision or finding>
- Dependencies: <updated TASK-IDs or "unchanged">
- Validation contract: <added/updated/unchanged>
- Notes: <link to replan-notes.md if detailed evidence is externalized>
```

## Conditional Confidence Pattern

```markdown
#### Re-plan Update (YYYY-MM-DD)
- Confidence: 70% (-> 84% conditional on TASK-54, TASK-55)
- Promotion blocked pending precursor evidence (E2/E3)
- Dependencies updated: TASK-54, TASK-55
```

## Evidence Citation Rule

For non-trivial claims, provide:
- file path + symbol/function/section identifier
- line numbers only when easy/stable
