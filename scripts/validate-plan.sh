#!/usr/bin/env bash
set -euo pipefail

node --import tsx packages/skill-runner/src/cli/validate-plan.ts "$@"
