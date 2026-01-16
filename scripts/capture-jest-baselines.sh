#!/bin/bash
# Script to capture Jest config baselines for all packages/apps
# This is used as part of the Jest preset consolidation effort

set -e

BASEDIR="/Users/petercowling/base-shop"
BASELINE_DIR="$BASEDIR/test/jest-baselines"

# List of packages/apps with jest.config.cjs
PACKAGES=(
  "packages/ui"
  "packages/email"
  "packages/types"
  "packages/tailwind-config"
  "packages/platform-core"
  "packages/page-builder-core"
  "packages/page-builder-ui"
  "packages/cms-marketing"
  "packages/templates"
  "packages/template-app"
  "apps/cms"
  "apps/api"
  "apps/dashboard"
  "apps/reception"
  "apps/cover-me-pretty"
)

echo "Capturing Jest config baselines..."
echo "Baseline directory: $BASELINE_DIR"
echo ""

# Ensure baseline directory exists
mkdir -p "$BASELINE_DIR"

for package in "${PACKAGES[@]}"; do
  package_dir="$BASEDIR/$package"
  config_file="$package_dir/jest.config.cjs"

  # Check if jest.config.cjs exists
  if [ ! -f "$config_file" ]; then
    echo "⚠️  Skipping $package (no jest.config.cjs found)"
    continue
  fi

  # Create a safe filename for the baseline
  safe_name=$(echo "$package" | tr '/' '-')
  output_file="$BASELINE_DIR/${safe_name}-config.json"

  echo "📸 Capturing baseline for $package..."

  # Capture the Jest config (complete JSON)
  cd "$package_dir"
  if npx jest --showConfig 2>/dev/null > "$output_file"; then
    echo "   ✅ Saved to ${safe_name}-config.json"
  else
    echo "   ❌ Failed to capture config for $package"
    rm -f "$output_file"
  fi

  cd "$BASEDIR"
done

echo ""
echo "✨ Baseline capture complete!"
echo "Baselines saved to: $BASELINE_DIR"
