#!/usr/bin/env bash
set -euo pipefail

scripts/git-hooks/pre-commit-check-env.sh
scripts/git-hooks/require-writer-lock.sh
node scripts/git-hooks/no-partially-staged.js
scripts/git-hooks/run-lint-staged.sh
scripts/git-hooks/typecheck-staged.sh
scripts/git-hooks/lint-staged-packages.sh
pnpm validate:agent-context

