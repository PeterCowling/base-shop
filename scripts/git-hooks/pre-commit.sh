#!/usr/bin/env bash
set -euo pipefail

bash scripts/git-hooks/pre-commit-check-env.sh
bash scripts/git-hooks/require-writer-lock.sh
node scripts/git-hooks/no-partially-staged.js
bash scripts/git-hooks/run-lint-staged.sh
bash scripts/git-hooks/typecheck-staged.sh
bash scripts/git-hooks/lint-staged-packages.sh
pnpm validate:agent-context
