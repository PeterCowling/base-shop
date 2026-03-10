# `cmd-advance` — Shared Advance Contract

## Business OS Sync Contract (Required Before Advance)

For each stage, require appropriate sync actions:

- `ASSESSMENT-09`: validate required ASSESSMENT precursor artifacts, then write/refresh `docs/business-os/startup-baselines/<BIZ>/<YYYY-MM-DD>-assessment-intake-packet.user.md`.
- `MEASURE-01/PRODUCT-01/MARKET-01..MARKET-06/SIGNALS-01/SIGNALS`: persist strategy/readiness artifacts under `docs/business-os/...` and update any `latest.user.md` pointers.
- `S4`: merge required strategy inputs, write baseline snapshot, and commit manifest pointer as current.
- `DO`: filesystem-only. Advance is gated on artifact existence and plan status (see GATE-WEBSITE-DO-01). No BOS API calls required for DO stage progression.

Never allow non-DO advance when required stage persistence has failed (DO advance remains filesystem-only).

---

## Failure Handling

When blocked, always provide:
1. Exact failing gate.
2. Exact prompt file.
3. Exact required output path.
4. One command-like next step.

Example:
- `Run Deep Research with prompt_file and save output to required_output_path, then run /startup-loop submit --business <BIZ> --stage MARKET-01 --artifact <path>.`

---

## Recommended Operator Sequence

1. `/startup-loop start --business <BIZ> --mode dry --launch-surface <...>`
2. `/startup-loop status --business <BIZ>` after each major output
3. `/startup-loop submit --business <BIZ> --stage <STAGE_ID> --artifact <path>` after producing artifact
4. `/startup-loop advance --business <BIZ>` when ready to move

## Red Flags (invalid operation)

1. Advancing a stage while required output is missing.
2. Advancing WEBSITE/DO while S4 merge-and-commit outputs are missing or failed.
3. Skipping MEASURE-01 (Agent-Setup) before downstream stages.
4. Skipping MEASURE-02 (Results) before PRODUCT-01.
5. Skipping PRODUCT-01 (Product from photo) before MARKET-01.
6. Continuing MARKET/SELL execution with stale or draft-only research artifacts.
