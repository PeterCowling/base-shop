Type: Guide
Status: Active
Domain: Repo
Last-reviewed: 2026-02-09

# Git & GitHub Workflow (Human UX)

This repository ships through one release pipeline only:

1. Commit on `dev`
2. Push `dev`
3. Auto PR `dev` -> `staging` (label: `pipeline`, auto-merge on green)
4. Promote `staging` -> `main` (label: `pipeline`, auto-merge on green)

## Happy Path (One Change)

### 1) Work on `dev`

```bash
git fetch origin --prune
git switch dev || git switch -c dev origin/dev || git switch -c dev origin/main
```

### 2) Make your change and commit

```bash
git status
git add <paths>
git commit -m "feat: short description"
```

### 3) Validate and push `dev`

```bash
bash scripts/validate-changes.sh
git push -u origin dev
```

### 4) Ship to staging

```bash
scripts/git/ship-to-staging.sh
```

### 5) Promote to production

```bash
git fetch origin --prune
git switch staging
scripts/git/promote-to-main.sh
```

## What GitHub Does

### Auto PR (`dev` -> `staging`)

Pushing `dev` triggers `.github/workflows/auto-pr.yml`, which:

- Ensures an open PR from `dev` to `staging`
- Adds the `pipeline` label
- Enables auto-merge (merge commit)

### Merge Gate (required check)

Watch **Merge Gate / Gate** on pipeline PRs.

- Green: required checks passed, auto-merge can proceed
- Red: fix failures, push `dev` again, and rerun the pipeline

### Auto-close behavior

Pipeline PRs may be auto-closed when:

- Required checks fail, or
- The PR is stale for too long

Use `keep-open` when you intentionally want a PR to stay open while red/inactive.

## Troubleshooting

### "I pushed, but no pipeline PR appeared"

1. Confirm branch is `dev`: `git branch --show-current`
2. Confirm push succeeded: `git log --oneline origin/dev -n 1`
3. Check Actions run: `Auto PR (dev → staging)`

### "Git blocks commit or push"

Hooks are expected to block unsafe operations.

- Hold writer lock via integrator wrapper:
  - `scripts/agents/integrator-shell.sh -- <command>`
- Follow hook output; do not bypass with `--no-verify`

### "I started on main/staging by mistake"

Do not use reset/rebase to recover. Move to `dev` and continue safely:

```bash
git fetch origin --prune
git switch dev || git switch -c dev origin/dev || git switch -c dev origin/main
```

## Safety Rules

- Never run destructive history-rewriting commands (`git reset --hard`, `git clean -fd`, `git push --force`, `git rebase`, `git commit --amend`).
- Never commit directly to `main` or `staging`.
- Prefer explicit path staging (`git add <file> ...`) when unrelated work exists.

See `docs/git-safety.md` for full policy.
