#!/usr/bin/env bash
set -euo pipefail

# Pre-push gate:
# 1) Enforce writer lock ownership
# 2) Block protected/non-fast-forward pushes
# 3) Validate only the commit ranges being pushed

tmp_refs="$(mktemp)"
trap 'rm -f "$tmp_refs"' EXIT
cat >"$tmp_refs"

scripts/git-hooks/require-writer-lock.sh
cat "$tmp_refs" | scripts/git-hooks/pre-push-safety.sh

zeros40="0000000000000000000000000000000000000000"
validated_any="0"

while read -r local_ref local_sha remote_ref remote_sha; do
  [[ -z "${remote_ref:-}" ]] && continue
  [[ "${local_sha:-}" == "$zeros40" ]] && continue

  range=""
  if [[ "${remote_sha:-}" == "$zeros40" ]]; then
    parent_sha="$(git rev-parse "${local_sha}^" 2>/dev/null || true)"
    if [[ -n "$parent_sha" ]]; then
      range="${parent_sha}..${local_sha}"
    else
      range="${local_sha}"
    fi
  else
    range="${remote_sha}..${local_sha}"
  fi

  echo "[pre-push] Validating range ${range} for ${remote_ref#refs/heads/}"
  VALIDATE_RANGE="$range" STRICT=1 bash scripts/validate-changes.sh
  validated_any="1"
done <"$tmp_refs"

if [[ "$validated_any" != "1" ]]; then
  echo "[pre-push] No branch updates required validation."
fi
