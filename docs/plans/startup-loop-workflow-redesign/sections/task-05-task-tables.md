## Business Operator Actions

These are the actions owned by Pete as venture-studio operator. Each row is a concrete next step — not a platform task.

| Action | Why it matters | Done when |
|---|---|---|
| Fill the Operational Confirmations form for HEAD | HEAD 90-day forecast cannot reach decision-grade without stock date, units, pricing, compatibility, payment readiness, and returns SLA. | All 6 fields confirmed and timestamped. |
| Fill the Operational Confirmations form for PET (inventory + costs) | PET forecast is not decision-grade without real inventory units, arrival date, and landed cost. | Inventory confirmed: units, arrival date, landed cost per unit all captured. |
| Run a 7-day paid acquisition test for PET | PET has no measured CPC or CVR yet — the forecast relies on seed assumptions until real data is captured. | First measured CPC and CVR documented from a 7-day live test. |
| Verify GA4 standard report signal for BRIK (begin_checkout + web_vitals) | The weekly BRIK decision loop needs confirmed non-zero signal in 7-day standard reports, not just realtime. | Non-zero begin_checkout and web_vitals in standard 7-day GA4 report. |
| Run the day-14 forecast recalibration for BRIK | BRIK v1 forecast is based on seed assumptions; first two weeks of measured data must replace them for reliable scaling decisions. | Day-14 recalibration document produced and integrated into the BRIK strategy plan. |
| Complete the Pre-website Measurement Setup checklist for HEAD | HEAD is pre-website; paid traffic cannot start without GA4, Search Console, and conversion event setup. | Measurement setup document at Active status. |
| Complete the Pre-website Measurement Setup checklist for PET | PET is pre-website; same measurement requirement as HEAD. | Measurement setup document at Active status. |
| Run the weekly K/P/C/S decision for each active business | Loop health depends on weekly cadence — decisions go stale within days without the weekly review. | Weekly K/P/C/S decision document produced and dated this week. |
| Run standing refresh prompts when cadence triggers | Market/channel/regulatory inputs go stale without periodic refresh. | Monthly market-pulse, channel-economics, and quarterly regulatory-watch documents up to date. |

---

## Platform Engineering Actions

These are platform and engineering tasks. They are not required from the operator — they are tracked here for visibility.

| Action | Why it matters | Done when |
|---|---|---|
| Resolve MCP identity/deployment decision (TASK-05 in MCP plan) | Guarded BOS write rollout cannot proceed safely until the identity and deployment model is confirmed. | Decision documented and the MCP plan TASK-05 marked complete. |
| Complete MCP guarded BOS write rollout (TASK-06 in MCP plan) | S5B/S7/S8/S9/S10 write paths need governed MCP write capability before BOS can be fully operationalised. | MCP guarded-write end-to-end test passes; TASK-06 marked complete. |
| Implement wave-2 measure_* MCP connectors | S2A/S3/S10 measurement stages need normalised cross-source measurement contracts — GA4, Search Console, and Cloudflare data accessible via MCP tools. | Wave-2 connector fact-find brief exists; at least one connector implemented and validated. |
| Automate Octorate Batch 1 (booking value) data collection | BRIK historical baseline currently relies on manual Batch 1 extraction — automation reduces refresh friction. | Automated extraction produces a valid booking value dataset matching the manual baseline format. |

> **Note for engineers:** The original "Open Tasks" table (with evidence paths and stage codes) is preserved verbatim in the Engineering appendix below.
