#!/usr/bin/env bash
# Validates .agents/skills/ integrity for Codex native skill discovery.
set -euo pipefail

AGENTS_SKILLS_DIR="${AGENTS_SKILLS_DIR:-.agents/skills}"
CLAUDE_SKILLS_DIR="${CLAUDE_SKILLS_DIR:-.claude/skills}"
errors=0

error() {
  echo "ERROR: $*"
  errors=$((errors + 1))
}

# 1) .agents/skills must be a real directory, not a symlink.
if [ -L "$AGENTS_SKILLS_DIR" ]; then
  error "$AGENTS_SKILLS_DIR is a symlink (must be a real directory)"
elif [ ! -d "$AGENTS_SKILLS_DIR" ]; then
  error "$AGENTS_SKILLS_DIR does not exist"
fi

# Build expected skill set from canonical source: directories containing SKILL.md.
expected_names=$(find "$CLAUDE_SKILLS_DIR" -mindepth 1 -maxdepth 1 -type d -exec test -f {}/SKILL.md \; -print 2>/dev/null | sed "s#.*/##" | sort)

# Build actual mirror entry set.
actual_names=$(find "$AGENTS_SKILLS_DIR" -mindepth 1 -maxdepth 1 \( -type d -o -type l \) -print 2>/dev/null | sed "s#.*/##" | sort)

# 2) Every mirror entry must resolve to a directory containing SKILL.md,
# and corresponding canonical target must exist.
while IFS= read -r name; do
  [ -n "$name" ] || continue
  entry="$AGENTS_SKILLS_DIR/$name"
  if [ ! -f "$entry/SKILL.md" ]; then
    error "$entry -> SKILL.md not found via mirror entry"
  fi
  if [ ! -f "$CLAUDE_SKILLS_DIR/$name/SKILL.md" ]; then
    error "$entry has no matching canonical SKILL.md at $CLAUDE_SKILLS_DIR/$name/SKILL.md"
  fi
done <<EOF_NAMES
$actual_names
EOF_NAMES

# 3) Every canonical skill must be mirrored.
while IFS= read -r name; do
  [ -n "$name" ] || continue
  if [ ! -e "$AGENTS_SKILLS_DIR/$name" ] && [ ! -L "$AGENTS_SKILLS_DIR/$name" ]; then
    error "missing mirror entry: $AGENTS_SKILLS_DIR/$name"
  fi
done <<EOF_EXPECTED
$expected_names
EOF_EXPECTED

# 4) Detect duplicate mirror names (defensive; should never happen on a normal FS).
total=$(printf "%s\n" "$actual_names" | sed "/^$/d" | wc -l | tr -d " ")
unique=$(printf "%s\n" "$actual_names" | sed "/^$/d" | sort -u | wc -l | tr -d " ")
if [ "$total" != "$unique" ]; then
  error "duplicate skill names detected in $AGENTS_SKILLS_DIR"
fi

if [ "$errors" -gt 0 ]; then
  echo "FAIL: $errors validation error(s)"
  exit 1
fi

echo "OK: $AGENTS_SKILLS_DIR valid ($total entries)"
