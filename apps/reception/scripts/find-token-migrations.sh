#!/bin/bash
# Find token migration opportunities in Reception codebase

echo "=== Token Migration Opportunities ==="
echo ""

echo "1. Raw Colors (58 violations) - Replace with token-based colors:"
echo "   Find: #4f46e5 → Use: text-action-primary or bg-action-primary"
echo "   Find: #10b981 → Use: text-action-success or bg-action-success"
echo "   Find: #fb923c → Use: text-action-warning or bg-action-warning"
echo "   Find: #e11d48 → Use: text-action-danger or bg-action-danger"
echo "   Find: #0ea5e9 → Use: text-action-info or bg-action-info"
echo "   Find: #14b8a6 → Use: text-action-neutral or bg-action-neutral"
echo ""
grep -r "#4f46e5\|#10b981\|#fb923c\|#e11d48\|#0ea5e9\|#14b8a6" src/ --include="*.tsx" --include="*.ts" | head -10
echo ""

echo "2. Arbitrary Font Sizes (23 violations) - Replace with token-based sizes:"
echo "   Find: text-[10px] → Use: text-ops-micro"
echo "   Find: text-[11px] → Use: text-ops-tiny"
echo "   Find: text-[13px] → Use: text-ops-compact"
echo ""
grep -r "text-\[1[0-3]px\]" src/ --include="*.tsx" --include="*.ts" | head -10
echo ""

echo "3. Arbitrary Widths/Heights (49 violations) - Replace with token-based sizes:"
echo "   Find: min-w-[40rem] → Use: min-w-[var(--ops-modal-lg)]"
echo "   Find: max-h-[60vh] → Use: max-h-[var(--ops-panel-medium)]"
echo "   Find: h-[80px] → Use: h-[var(--ops-card-height)]"
echo ""
grep -r "min-w-\[.*rem\]\|max-h-\[.*vh\]\|h-\[.*px\]" src/ --include="*.tsx" --include="*.ts" | head -10
echo ""

echo "4. Layout Primitives (42 violations) - Replace flex/grid with primitives:"
echo "   Find: flex flex-col → Use: <Stack>"
echo "   Find: flex → Use: <Inline> or <Cluster>"
echo "   Find: grid → Use: <Grid>"
echo ""
grep -r "className=.*flex flex-col\|className=.*\"flex\"\|className=.*grid" src/ --include="*.tsx" | head -10
echo ""

echo "=== Quick Wins ==="
echo ""
echo "Files with most violations:"
cd src && find . -name "*.tsx" -exec sh -c 'echo "$(grep -c "#[0-9a-f]\{6\}\|text-\[[0-9]" {} 2>/dev/null || echo 0) {}"' \; | sort -rn | head -10
