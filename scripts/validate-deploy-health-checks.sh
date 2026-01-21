#!/usr/bin/env bash
# Validate that all deploy workflows have health check configuration.
# This script is used for CI enforcement and local validation.
#
# Usage: ./scripts/validate-deploy-health-checks.sh
#
# Exit codes:
#   0 - All deploy workflows have health checks
#   1 - One or more deploy workflows missing health checks

set -euo pipefail

WORKFLOWS_DIR=".github/workflows"
ERRORS=()
CHECKED=0

echo "Validating deploy workflows for health check configuration..."
echo ""

# Check each workflow file
for workflow in "$WORKFLOWS_DIR"/*.yml; do
  filename=$(basename "$workflow")

  # Skip non-deploy workflows
  if [[ "$filename" == "auto-"* ]] || \
     [[ "$filename" == "storybook.yml" ]] || \
     [[ "$filename" == "cypress.yml" ]] || \
     [[ "$filename" == "test.yml" ]] || \
     [[ "$filename" == "ci-lighthouse.yml" ]] || \
     [[ "$filename" == "consent-analytics.yml" ]]; then
    continue
  fi

  # Check if workflow has a deploy command (deploy-cmd input, deploy job, or deploy step)
  if grep -qE "deploy-cmd:|^\s+deploy:|name:.*[Dd]eploy|next-on-pages deploy|wrangler.*deploy" "$workflow" 2>/dev/null; then
    CHECKED=$((CHECKED + 1))

    # Check for health check configuration
    has_health_check=false

    # Option 1: Uses reusable-app.yml with project-name or healthcheck-url
    if grep -q "uses:.*reusable-app.yml" "$workflow"; then
      if grep -q "project-name:" "$workflow" || grep -q "healthcheck-url:" "$workflow"; then
        has_health_check=true
      fi
    fi

    # Option 2: Has explicit health check step
    if grep -q "post-deploy-health-check\|health.check\|Health Check" "$workflow"; then
      has_health_check=true
    fi

    if $has_health_check; then
      echo "  ✅ $filename"
    else
      echo "  ❌ $filename - missing health check configuration"
      ERRORS+=("$filename")
    fi
  fi
done

echo ""
echo "Checked $CHECKED deploy workflow(s)"

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo ""
  echo "ERROR: ${#ERRORS[@]} workflow(s) missing health checks:"
  for err in "${ERRORS[@]}"; do
    echo "  - $err"
  done
  echo ""
  echo "To fix:"
  echo "  1. If using reusable-app.yml: add 'project-name' or 'healthcheck-url' input"
  echo "  2. If using custom deploy: add post-deploy-health-check.sh step"
  echo ""
  echo "See docs/deploy-health-checks.md for details."
  exit 1
fi

echo ""
echo "All deploy workflows have health check configuration."
exit 0
