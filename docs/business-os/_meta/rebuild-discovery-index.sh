#!/bin/bash
# Rebuild the discovery index for workflow skills
# Run this after adding/moving cards, ideas, or updating plans

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

# Enable nullglob globally for this script
shopt -s nullglob

echo '{'
echo '  "generated": "'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'",'

# ========== FACT-FIND: Raw ideas ==========
echo '  "rawIdeas": ['
first=true
for f in docs/business-os/ideas/inbox/*.user.md; do
  id=$(basename "$f" .user.md)
  title=$(grep -m1 "^# " "$f" | sed 's/^# //' || echo "$id")
  business=$(grep -m1 "^Business:" "$f" | sed 's/Business: //')
  [ "$first" = true ] && first=false || echo ','
  printf '    {"id": "%s", "title": "%s", "business": "%s"}' "$id" "$title" "$business"
done
echo ''
echo '  ],'

# ========== FACT-FIND: Inbox cards ==========
echo '  "inbox": ['
first=true
for f in docs/business-os/cards/*.user.md; do
  lane=$(grep -m1 "^Lane:" "$f" | sed 's/Lane: //')
  [ "$lane" = "Inbox" ] || continue
  id=$(basename "$f" .user.md)
  title=$(grep -m1 "^Title:" "$f" | sed 's/Title: //')
  business=$(grep -m1 "^Business:" "$f" | sed 's/Business: //')
  [ "$first" = true ] && first=false || echo ','
  printf '    {"id": "%s", "title": "%s", "business": "%s"}' "$id" "$title" "$business"
done
echo ''
echo '  ],'

# ========== FACT-FIND: Cards in Fact-finding lane ==========
echo '  "factFinding": ['
first=true
for f in docs/business-os/cards/*.user.md; do
  lane=$(grep -m1 "^Lane:" "$f" | sed 's/Lane: //')
  [ "$lane" = "Fact-finding" ] || continue
  id=$(basename "$f" .user.md)
  title=$(grep -m1 "^Title:" "$f" | sed 's/Title: //')
  business=$(grep -m1 "^Business:" "$f" | sed 's/Business: //')
  [ "$first" = true ] && first=false || echo ','
  printf '    {"id": "%s", "title": "%s", "business": "%s"}' "$id" "$title" "$business"
done
echo ''
echo '  ],'

# ========== PLAN-FEATURE: Ready for planning ==========
echo '  "readyForPlanning": ['
first=true
for f in docs/plans/*-fact-find.md; do
  status=$(grep -m1 "^Status:" "$f" | sed 's/Status: //')
  [ "$status" = "Ready-for-planning" ] || continue
  slug=$(basename "$f" -fact-find.md)
  cardId=$(grep -m1 "^Card-ID:" "$f" | sed 's/Card-ID: //' || echo "")
  business=$(grep -m1 "^Business-Unit:" "$f" | sed 's/Business-Unit: //' || echo "")
  title=$(grep -m1 "^# " "$f" | sed 's/^# //' | sed 's/ Fact-Find Brief//')
  [ "$first" = true ] && first=false || echo ','
  printf '    {"slug": "%s", "title": "%s", "cardId": "%s", "business": "%s"}' "$slug" "$title" "$cardId" "$business"
done
echo ''
echo '  ],'

# ========== BUILD-FEATURE: Active plans with eligible tasks ==========
echo '  "readyForBuild": ['
first=true
for f in docs/plans/*-plan.md; do
  status=$(grep -m1 "^Status:" "$f" | sed 's/Status: //')
  [ "$status" = "Active" ] || continue
  slug=$(basename "$f" -plan.md)
  cardId=$(grep -m1 "^Card-ID:" "$f" | sed 's/Card-ID: //' || echo "")
  business=$(grep -m1 "^Business-Unit:" "$f" | sed 's/Business-Unit: //' || echo "")
  pendingCount=$(grep -c "Status: Pending" "$f" 2>/dev/null || true)
  pendingCount=${pendingCount:-0}
  title=$(grep -m1 "^# " "$f" | sed 's/^# //' | sed 's/ Implementation Plan//' | sed 's/ Plan//')
  [ "$first" = true ] && first=false || echo ','
  printf '    {"slug": "%s", "title": "%s", "cardId": "%s", "business": "%s", "pendingTasks": %s}' "$slug" "$title" "$cardId" "$business" "$pendingCount"
done
echo ''
echo '  ],'

# ========== Cards in Planned lane (for build-feature via card ID) ==========
echo '  "planned": ['
first=true
for f in docs/business-os/cards/*.user.md; do
  lane=$(grep -m1 "^Lane:" "$f" | sed 's/Lane: //')
  [ "$lane" = "Planned" ] || continue
  id=$(basename "$f" .user.md)
  title=$(grep -m1 "^Title:" "$f" | sed 's/Title: //')
  business=$(grep -m1 "^Business:" "$f" | sed 's/Business: //')
  planLink=$(grep -m1 "^Plan-Link:" "$f" | sed 's/Plan-Link: //' || echo "")
  [ "$first" = true ] && first=false || echo ','
  printf '    {"id": "%s", "title": "%s", "business": "%s", "planLink": "%s"}' "$id" "$title" "$business" "$planLink"
done
echo ''
echo '  ]'

echo '}'
