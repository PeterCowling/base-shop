#!/usr/bin/env bash
set -euo pipefail

scripts/git-hooks/pre-commit-check-env.sh
scripts/git-hooks/require-writer-lock.sh
node scripts/git-hooks/no-partially-staged.js
scripts/git-hooks/run-lint-staged.sh
pnpm typecheck
pnpm lint
pnpm validate:agent-context

