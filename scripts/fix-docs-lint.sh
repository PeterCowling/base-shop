#!/bin/bash
# Fix documentation linting errors

set -e

echo "Fixing documentation linting errors..."

# Fix non-standard Status values in plans and audits
# "Complete" -> "Historical"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: Complete$/Status: Historical/g' {} +

# "Completed" -> "Historical"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: Completed$/Status: Historical/g' {} +

# "Complete (focused)" -> "Historical"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: Complete (focused)$/Status: Historical/g' {} +

# "Superseded (Implementation Complete)" -> "Superseded"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: Superseded (Implementation Complete)$/Status: Superseded/g' {} +

# "In-Progress" -> "Active"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: In-Progress$/Status: Active/g' {} +

# "In Progress" -> "Active"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: In Progress$/Status: Active/g' {} +

# "In progress" -> "Active"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: In progress$/Status: Active/g' {} +

# "Archived" -> "Historical"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: Archived$/Status: Historical/g' {} +

# "Planning-Complete" -> "Proposed"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: Planning-Complete$/Status: Proposed/g' {} +

# "Ready-for-planning" -> "Draft"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: Ready-for-planning$/Status: Draft/g' {} +

# "Needs-input" -> "Draft"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: Needs-input$/Status: Draft/g' {} +

# "Implemented" -> "Historical"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: Implemented$/Status: Historical/g' {} +

# "Worked" -> "Historical"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: Worked$/Status: Historical/g' {} +

# "raw" -> "Draft"
find docs -type f -name "*.md" -exec sed -i '' 's/^Status: raw$/Status: Draft/g' {} +

echo "Fixed non-standard Status values"

# Add missing Status and Last-updated headers to card files
# We'll do this with a Node.js script for better control
node --import tsx scripts/src/fix-card-headers.ts

echo "Done!"
