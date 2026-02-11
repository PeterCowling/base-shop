#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$repo_root"

target=".claude/skills/ideas-go-faster/SKILL.md"
fail=0

check_fail() {
  echo "FAIL: $1" >&2
  fail=1
}

# F1: no deferred-cabinet contradiction.
if rg -q "Technical cabinet deferred|CS-13" "$target"; then
  check_fail "Deferred technical cabinet contradiction still present (F1)"
fi

# F5: no stale lens identity.
if rg -q "Originator-Lens: engineering" "$target"; then
  check_fail "Stale lens identity 'engineering' still present (F5)"
fi
if ! rg -q "Originator-Lens.*code-review" "$target"; then
  check_fail "Canonical code-review lens identity missing (F5)"
fi

# F3: gate-unresolved tag must appear in orchestrator hold contract.
if ! rg -q "gate-unresolved" "$target"; then
  check_fail "gate-unresolved missing from orchestrator hold contract (F3)"
fi

# F4: resurfacing location semantics must be explicit.
if rg -q 'pass `location=all`|location=all \(or' "$target"; then
  check_fail "Stale resurfacing contract still instructs use of location=all (F4)"
fi
if ! rg -q 'query both `inbox` and `worked`|both `inbox` and `worked`' "$target"; then
  check_fail "DGP resurfacing inbox/worked query semantics missing (F4)"
fi

# F6: Stage 7b invocation surface must exist.
if ! rg -q -- "/ideas-go-faster --stage7b" "$target"; then
  check_fail "Stage 7b invocation surface missing from Invocation block (F6)"
fi

# F7: report section numbering must be sequential.
report_nums="$(
  awk '
    /^\*\*Report sections:\*\*/ { in_block=1; next }
    /^\*\*Stance propagation note:\*\*/ { in_block=0 }
    in_block && $0 ~ /^[0-9]+\./ {
      match($0, /^[0-9]+/)
      print substr($0, RSTART, RLENGTH)
    }
  ' "$target"
)"

if [[ -z "$report_nums" ]]; then
  check_fail "Could not parse Report sections numbering (F7)"
else
  expected=1
  while IFS= read -r value; do
    [[ -z "$value" ]] && continue
    if [[ "$value" -ne "$expected" ]]; then
      check_fail "Report section numbering not sequential: expected $expected found $value (F7)"
      break
    fi
    expected=$((expected + 1))
  done <<< "$report_nums"
fi

# F8: generation cadence must enforce focused divergence then deepening.
if ! rg -q "Generation cadence \(quality-first, mandatory\)" "$target"; then
  check_fail "Generation cadence block missing (F8)"
fi
if ! rg -q "Generate 0-1 candidate idea per sub-expert per business" "$target"; then
  check_fail "Divergence cap (0-1 per sub-expert) missing (F8)"
fi
if ! rg -q "Deepening pass:\*\* Deepen only the top 8 candidates per business \(hard cap: 10\)" "$target"; then
  check_fail "Deepening cap (top 8, hard cap 10) missing (F8)"
fi

# F9: depth gate fields must be required before Stage 2.
if ! rg -q "Depth gate" "$target"; then
  check_fail "Depth gate contract missing (F9)"
fi
if ! rg -q "Evidence-Pointers.*>=2" "$target"; then
  check_fail "Depth gate evidence floor missing (F9)"
fi
if ! rg -q "Falsification-Test" "$target"; then
  check_fail "Depth gate falsification test missing (F9)"
fi
if ! rg -q "First-Signal" "$target"; then
  check_fail "Depth gate first-signal requirement missing (F9)"
fi

# F10: coverage-based rerun contract must exist.
if ! rg -q "Coverage target:\*\* finish >=80%|Coverage target: finish >=80%" "$target"; then
  check_fail "Coverage target (>=80%) missing (F10)"
fi
if ! rg -q 'coverage ratio is `<0\.80`' "$target"; then
  check_fail "Coverage rerun threshold (<0.80) missing (F10)"
fi
if ! rg -q "Quality-Rerun-Required: yes \| no" "$target"; then
  check_fail "Quality-Rerun-Required frontmatter contract missing (F10)"
fi

# F11: signal-quality metrics must be explicit in report frontmatter/sections.
if ! rg -q "Signal-Quality-Presentable-Rate: N%" "$target"; then
  check_fail "Presentable-rate metric missing (F11)"
fi
if ! rg -q "Signal-Quality-Contrarian-Unresolved-Rate: N%" "$target"; then
  check_fail "Contrarian unresolved-rate metric missing (F11)"
fi
if ! rg -q "Signal-Quality-Evidence-Density: N.N" "$target"; then
  check_fail "Evidence-density metric missing (F11)"
fi
if ! rg -q "Signal Quality:\*\* presentable-rate" "$target"; then
  check_fail "Signal Quality report section missing (F11)"
fi

# F12: dry-run mode must be explicitly supported and safe.
if ! rg -q -- "/ideas-go-faster --dry-run" "$target"; then
  check_fail "Dry-run invocation missing (F12)"
fi
if ! rg -q "Persistence-Mode: live \| dry-run" "$target"; then
  check_fail "Persistence-Mode frontmatter contract missing (F12)"
fi
if ! rg -q "Dry-Run-Writes-Blocked: yes \| no" "$target"; then
  check_fail "Dry-Run-Writes-Blocked frontmatter contract missing (F12)"
fi
if ! rg -q "Dry-run override \(mandatory\):" "$target"; then
  check_fail "Dry-run override contract missing in Stage 6/7 (F12)"
fi
if ! rg -q 'do NOT call `POST /api/agent/ideas` or `POST /api/agent/cards`' "$target"; then
  check_fail "Dry-run write-block contract missing for ideas/cards (F12)"
fi
if ! rg -q "Dry-run performed persistence writes" "$target"; then
  check_fail "Dry-run write violation red flag missing (F12)"
fi
if ! rg -q 'Write call attempted during `--dry-run`' "$target"; then
  check_fail "Dry-run error-handling contract missing (F12)"
fi
if ! rg -q "\*\*Dry run:\*\*" "$target"; then
  check_fail "Dry-run completion message missing (F12)"
fi

# F13: Who Said What section must exist in report contract.
if ! rg -q "Who Said What \(F1\)" "$target"; then
  check_fail "Who Said What report section missing (F13)"
fi
if ! rg -q "Who Said What section present" "$target"; then
  check_fail "Who Said What checklist contract missing (F13)"
fi

# F14: Tool-Gap register section must exist in report contract.
if ! rg -q "Tool-Gap Register \(F2\)" "$target"; then
  check_fail "Tool-Gap Register report section missing (F14)"
fi
if ! rg -q "Tool-Gap Register present" "$target"; then
  check_fail "Tool-Gap Register checklist contract missing (F14)"
fi

# F15: Kill/Hold rationale section must exist in report contract.
if ! rg -q "Kill/Hold Rationale \(F4\)" "$target"; then
  check_fail "Kill/Hold Rationale report section missing (F15)"
fi
if ! rg -q "Kill/Hold rationale present" "$target"; then
  check_fail "Kill/Hold rationale checklist contract missing (F15)"
fi

# F16: Delta/Coverage section must exist in report contract.
if ! rg -q "Delta/Coverage \(F6\)" "$target"; then
  check_fail "Delta/Coverage report section missing (F16)"
fi
if ! rg -q "Delta/Coverage section present" "$target"; then
  check_fail "Delta/Coverage checklist contract missing (F16)"
fi

# F17: assumptions source contract must be explicit.
if ! rg -q "Assumptions-Source: none \| inline \| file" "$target"; then
  check_fail "Assumptions-Source frontmatter contract missing (F17)"
fi
if ! rg -q "file input takes precedence" "$target"; then
  check_fail "Assumptions precedence contract missing (F17)"
fi

# F18: verbosity mode contract must be explicit and bounded.
if ! rg -q "Verbosity-Mode: compact \| standard \| extended" "$target"; then
  check_fail "Verbosity-Mode frontmatter contract missing (F18)"
fi
if ! rg -q "compact.*<=120 words" "$target"; then
  check_fail "Compact verbosity limit missing (F18)"
fi
if ! rg -q "standard.*<=220 words" "$target"; then
  check_fail "Standard verbosity limit missing (F18)"
fi
if ! rg -q "extended.*<=350 words" "$target"; then
  check_fail "Extended verbosity limit missing (F18)"
fi

# F19: technical cabinet applies_to routing contract must be explicit.
if ! rg -q "applies_to" "$target"; then
  check_fail "Technical cabinet applies_to contract missing (F19)"
fi
if ! rg -q 'Technical cabinet idea missing `applies_to`' "$target"; then
  check_fail "Technical cabinet applies_to red-flag missing (F19)"
fi

# F20: assumption challenge section and verdict contract must exist.
if ! rg -q "Assumption Challenge \(F3\)" "$target"; then
  check_fail "Assumption Challenge report section missing (F20)"
fi
if ! rg -q 'accept`, `condition`, or `reject`' "$target"; then
  check_fail "Assumption challenge verdict contract missing (F20)"
fi
if ! rg -q "Assumption challenge executed" "$target"; then
  check_fail "Assumption challenge checklist contract missing (F20)"
fi
if ! rg -q "Assumption challenge missing despite provided assumptions" "$target"; then
  check_fail "Assumption challenge red-flag missing (F20)"
fi

# F21: economics gate section and blocker contract must exist.
if ! rg -q "Economics Gate \(F5\)" "$target"; then
  check_fail "Economics Gate report section missing (F21)"
fi
if ! rg -q "Economics-Gate: \\[pass\\|blocked\\]" "$target"; then
  check_fail "Economics-Gate decision-log contract missing (F21)"
fi
if ! rg -q "Upside" "$target" || ! rg -q "Downside" "$target" || ! rg -q "Reversibility" "$target" || ! rg -q "Cost-of-Delay" "$target" || ! rg -q "Time-to-Signal" "$target"; then
  check_fail "Economics required-field contract incomplete (F21)"
fi
if ! rg -q "Economics gate executed" "$target"; then
  check_fail "Economics gate checklist contract missing (F21)"
fi
if ! rg -q "Economics gate bypassed" "$target"; then
  check_fail "Economics gate red-flag missing (F21)"
fi

# F22: 3A/3B persistence split contract must be explicit.
if ! rg -q "Stage 5.5: Persistence Prepare \(3A Contract\)" "$target"; then
  check_fail "3A persistence prepare stage missing (F22)"
fi
if ! rg -q "Stage 6: Persistence Commit \(3B\)" "$target"; then
  check_fail "3B persistence commit stage missing (F22)"
fi
if ! rg -q "commit-manifest.json" "$target"; then
  check_fail "Commit manifest artifact contract missing (F22)"
fi
if ! rg -q "write-ledger.jsonl" "$target"; then
  check_fail "Write ledger artifact contract missing (F22)"
fi
if ! rg -q "card-id-map.json" "$target"; then
  check_fail "Card ID map artifact contract missing (F22)"
fi
if ! rg -q "operation_id" "$target" || ! rg -q "payload_fingerprint" "$target" || ! rg -q "depends_on" "$target"; then
  check_fail "Manifest required fields missing (F22)"
fi
if ! rg -Fq "{{CARD_ID}}" "$target"; then
  check_fail "Fact-find CARD_ID placeholder contract missing (F22)"
fi
if ! rg -q "operation_id \\+ payload_fingerprint" "$target"; then
  check_fail "Rerun skip guard key contract missing (F22)"
fi
if ! rg -q "3A manifest emitted" "$target"; then
  check_fail "3A checklist contract missing (F22)"
fi
if ! rg -q "3B write ledger emitted" "$target"; then
  check_fail "3B checklist contract missing (F22)"
fi
if ! rg -q "Missing 3A commit manifest" "$target"; then
  check_fail "3A red-flag contract missing (F22)"
fi
if ! rg -q "Fact-find write attempted before card ID resolution" "$target"; then
  check_fail "Card-ID resolution red-flag contract missing (F22)"
fi
if ! rg -q "Rerun duplicate write guard missing" "$target"; then
  check_fail "Rerun guard red-flag contract missing (F22)"
fi

# F23: RS-04 validator + legacy control mapping must exist and be self-tested.
output_validator="scripts/check-ideas-go-faster-output.sh"
legacy_mapping="docs/business-os/ideas-go-faster-legacy-control-mapping.md"

if [[ ! -x "$output_validator" ]]; then
  check_fail "Output validator missing or not executable at $output_validator (F23)"
fi
if [[ ! -f "$legacy_mapping" ]]; then
  check_fail "Legacy control mapping file missing at $legacy_mapping (F23)"
fi
if [[ -f "$legacy_mapping" ]] && ! rg -q "Legacy-Checklist-Count: 24" "$legacy_mapping"; then
  check_fail "Legacy checklist count marker missing from mapping doc (F23)"
fi
if [[ -f "$legacy_mapping" ]] && ! rg -q "Legacy-Red-Flag-Count: 20" "$legacy_mapping"; then
  check_fail "Legacy red-flag count marker missing from mapping doc (F23)"
fi
if [[ -x "$output_validator" ]] && ! "$output_validator" --self-test >/dev/null; then
  check_fail "Output validator deliberate-failure self-test failed (F23)"
fi

# F24: sales-first portfolio directives must be explicit.
if ! rg -q "Sales-First Portfolio Directives" "$target"; then
  check_fail "Sales-first directives block missing (F24)"
fi
if ! rg -q "Portfolio split.*95%.*5%" "$target"; then
  check_fail "95/5 portfolio split contract missing (F24)"
fi
if ! rg -q "PLAT/BOS idea rule" "$target"; then
  check_fail "PLAT/BOS enablement-only rule missing (F24)"
fi
if ! rg -q "UI/DS rule" "$target"; then
  check_fail "UI/DS standalone exclusion rule missing (F24)"
fi
if ! rg -q "Convergence rule" "$target"; then
  check_fail "Startup checkout/inventory convergence rule missing (F24)"
fi
if ! rg -q "Sales-readiness gate \(mandatory for startup launch/sales-go-live ideas\)" "$target"; then
  check_fail "Sales-readiness gate contract missing (F24)"
fi
if ! rg -q "User-Test-CLI-Audit-Evidence" "$target"; then
  check_fail "CLI audit evidence field missing (F24)"
fi
if ! rg -q "User-Test-ChatGPT-Evidence" "$target"; then
  check_fail "ChatGPT evidence field missing (F24)"
fi
if ! rg -q "Two-source user-testing contract" "$target"; then
  check_fail "Two-source user-testing contract missing (F24)"
fi
if ! rg -q "Single-source user testing is invalid" "$target"; then
  check_fail "Single-source user-testing rejection rule missing (F24)"
fi
if ! rg -q "Google-Monitoring-Evidence" "$target"; then
  check_fail "Google monitoring evidence requirement missing (F24)"
fi
if ! rg -q "GA4 \\+ Search Console" "$target"; then
  check_fail "GA4/Search Console monitoring baseline missing (F24)"
fi
if ! rg -q "NO_JS_BAILOUT_MARKER" "$target" || ! rg -q "hasNoI18nKeyLeak" "$target" || ! rg -q "hasMetadataBodyParity" "$target" || ! rg -q "hasSocialProofSnapshotDate" "$target"; then
  check_fail "CLI audit predicate contract missing (F24)"
fi
if ! rg -q "\\.\\.\\.-seo-summary\\.json" "$target" || ! rg -q "\\.\\.\\.-seo-artifacts/" "$target"; then
  check_fail "CLI SEO artifact contract missing (F24)"
fi
if ! rg -q "Standalone UI/DS cleanup promoted" "$target"; then
  check_fail "UI/DS red-flag contract missing (F24)"
fi
if ! rg -q "Non-convergent startup checkout/inventory promoted" "$target"; then
  check_fail "Convergence red-flag contract missing (F24)"
fi
if ! rg -q "CLI audit evidence ignores required audit settings" "$target"; then
  check_fail "CLI audit settings red-flag contract missing (F24)"
fi

# F25: in-run progress update contract must be explicit.
if ! rg -q "In-Run Progress Updates \(Mandatory\)" "$target"; then
  check_fail "In-run progress update section missing (F25)"
fi
if ! rg -q "progress.user.md" "$target"; then
  check_fail "Progress artifact path contract missing (F25)"
fi
if ! rg -q "Type: Sweep-Progress" "$target"; then
  check_fail "Progress artifact frontmatter contract missing (F25)"
fi
if ! rg -q "Current-Stage: preflight .* stage-7.5 .* complete" "$target"; then
  check_fail "Progress current-stage lifecycle contract missing (F25)"
fi
if ! rg -Fq 'heartbeat updates every `<=90 seconds`' "$target"; then
  check_fail "Progress heartbeat cadence contract missing (F25)"
fi
if ! rg -Fq 'Progress: <stage> <state> (<completed>/<total>)' "$target"; then
  check_fail "Terminal progress line contract missing (F25)"
fi
if ! rg -q "Progress-Artifact: docs/business-os/sweeps/<YYYY-MM-DD>-progress.user.md" "$target"; then
  check_fail "Sweep frontmatter progress linkage missing (F25)"
fi
if ! rg -q "Run Progress Trace" "$target"; then
  check_fail "Run Progress Trace report section missing (F25)"
fi
if ! rg -q "Progress updates emitted" "$target"; then
  check_fail "Progress checklist contract missing (F25)"
fi
if ! rg -q "Missing in-run progress updates" "$target"; then
  check_fail "Progress red-flag contract missing (F25)"
fi
if ! rg -q "Progress artifact write/update fails" "$target"; then
  check_fail "Progress error-handling contract missing (F25)"
fi

# F26: API preflight strictness + dry-run degraded fallback contract must be explicit.
runner_script="scripts/run-ideas-go-faster.sh"
if [[ ! -x "$runner_script" ]]; then
  check_fail "Ideas-go-faster runner script missing or not executable at $runner_script (F26)"
fi
if ! rg -q "IDEAS_GO_FASTER_AGENT_CLI" "$runner_script"; then
  check_fail "Runner agent CLI override contract missing (F26)"
fi
if ! rg -q "codex exec" "$runner_script" || ! rg -q "claude -p" "$runner_script"; then
  check_fail "Runner must support both codex and claude execution paths (F26)"
fi
if ! rg -q "/api/agent/businesses" "$runner_script" || ! rg -q "API preflight failed" "$runner_script"; then
  check_fail "Runner deterministic API preflight check missing (F26)"
fi
if ! rg -q -- "/ideas-go-faster --dry-run --allow-api-degraded" "$target"; then
  check_fail "allow-api-degraded invocation missing (F26)"
fi
if ! rg -Fq -- '`--allow-api-degraded` is valid only with `--dry-run`' "$target"; then
  check_fail "allow-api-degraded dry-run-only rule missing (F26)"
fi
if ! rg -q "API preflight mode \(run-level\)" "$target"; then
  check_fail "API preflight mode contract block missing (F26)"
fi
if ! rg -q "API-Preflight-Mode: strict \\| degraded-filesystem-only" "$target"; then
  check_fail "API-Preflight-Mode frontmatter contract missing (F26)"
fi
if ! rg -q "Dry-run degraded preflight fallback" "$target"; then
  check_fail "Dry-run degraded preflight fallback contract missing (F26)"
fi
if ! rg -q "Live mode never uses degraded preflight fallback" "$target"; then
  check_fail "Live-mode strict preflight rule missing (F26)"
fi
if ! rg -q "API degraded mode used without explicit dry-run opt-in" "$target"; then
  check_fail "API degraded opt-in red-flag missing (F26)"
fi
if ! rg -q "API degraded mode used in live persistence mode" "$target"; then
  check_fail "API degraded live-mode red-flag missing (F26)"
fi
if ! rg -q "\*\*API preflight mode recorded:\*\*" "$target"; then
  check_fail "API preflight checklist contract missing (F26)"
fi
if ! rg -q "\*\*Degraded preflight rules honored:\*\*" "$target"; then
  check_fail "Degraded preflight checklist contract missing (F26)"
fi

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "PASS: ideas-go-faster contract checks passed."
