---
Type: INVESTIGATE
Task: TASK-01
Plan: startup-loop-process-map-generator
Status: Complete
Created: 2026-02-23
---

# TASK-01: Per-Stage HTML Annotation Extraction

Source: `docs/business-os/startup-loop-containers-process-map.html`

Only swim-lane stages (MARKET-01..05, PRODUCT-01, PRODUCTS-01..07, LOGISTICS-01..07) are
listed here — these are the stages that `buildHtml()` generates dynamically. All other
sections (ASSESSMENT, MEASURE, MARKET-06, fan-out, DO, S-stages, IDEAS) are kept
verbatim in the template file.

## Findings

### Key structural notes

- `.sname` in the HTML is a user-friendly title-cased version of `label_operator_short`
  — mostly identical after title-casing, with a few exceptions (see "html_name overrides" below).
- `.sproduce` in the HTML is user-facing prose, deliberately different from the YAML
  `outcome_operator` (which is operator/agent-facing). Must be stored in the lookup table.
- `.sfrom` uses two CSS classes: `sfrom-seed` (↙ seeded once) and `sfrom-live` (↻ always reads / informed by).
- `.swho` badges use CSS classes: `bw-bot`, `bw-both`, `bw-you`, `bw-req`, `bw-opt`, `bw-star`.
- PRODUCTS-02 and PRODUCTS-04 have `.sync-gate` badges (cross-stream sync points).
- PRODUCTS-07 and LOGISTICS-07 have `.highlight` class.
- LOGISTICS stages are all `.conditional`.

### html_name overrides (YAML label_operator_short differs from HTML sname)

| Stage ID | YAML label_operator_short | HTML sname |
|---|---|---|
| MARKET-05 | "Assumptions and risk" | "Assumptions & Risk Register" |
| PRODUCTS-04 | "Bundle hypotheses" | "Bundle & Packaging Hypotheses" |
| LOGISTICS-01 | "Supplier mapping" | "Supplier & Manufacturer Mapping" |
| LOGISTICS-02 | "Lead time and MOQ baseline" | "Lead Times & MOQ Baseline" |
| LOGISTICS-03 | "Fulfillment channel options" | "Fulfilment Options" |
| LOGISTICS-04 | "Cost and margin by route" | "Cost & Margin by Route" |
| LOGISTICS-05 | "Returns and quality baseline" | "Returns & Quality Baseline" |

### SID suffix notes (conditional stages with extra label text)

| Stage ID | Suffix text |
|---|---|
| PRODUCTS-03 | "Only once you have live sales data" |
| PRODUCTS-05 | "Only once you have live sales data" |
| PRODUCTS-06 | "Only once you have live sales data" |
| SELL-08 | "Only when paid spend is planned" |

### Full annotation map (swim-lane stages only)

```json
{
  "MARKET-01": {
    "dom_id": "stage-market-01",
    "html_produce": "A map of your competitors — what they offer, their strengths, where they're weak",
    "sfrom": "<span class=\"sfrom-live\">↻ Always reads</span> current problem framing (MEASURE-00) — if problem framing changes, re-run this stage",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "MARKET-02": {
    "html_produce": "Evidence that real demand exists — search volume, social signals, marketplace data, with confidence ratings",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "MARKET-03": {
    "dom_id": "stage-market-03",
    "html_produce": "Typical price ranges in your market, by competitor set",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "MARKET-04": {
    "html_produce": "Which sales channels work in your space, which don't, and why",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "MARKET-05": {
    "html_name": "Assumptions & Risk Register",
    "html_produce": "What you're assuming to be true, rated by risk — so you know what to test first",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "PRODUCT-01": {
    "dom_id": "s-product",
    "html_produce": "Your initial product record — name, description, dimensions, materials, price point — built from photos or descriptions you provide",
    "sfrom": "<span class=\"sfrom-seed\">↙ Seeded once from</span> assessment intake (product definition, scope &amp; constraints from ASSESSMENT-03)",
    "swho": [{"cls": "bw bw-both", "text": "🤝 Both"}]
  },
  "PRODUCTS-01": {
    "html_produce": "A map of everything you sell, with positioning notes for each",
    "sfrom": "<span class=\"sfrom-seed\">↙ Seeded once from</span> assessment intake (product definitions from ASSESSMENT-03)",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "PRODUCTS-02": {
    "dom_id": "stage-products-02",
    "html_produce": "What competitors sell and at what price points",
    "sfrom": "<span class=\"sfrom-live\">↻ Informed by</span> MARKET-01 competitor map — run after MARKET-01 where possible",
    "sync_gate": {
      "text": "⇦ Sync point — wait for MARKET-01",
      "color": "#f59e0b",
      "bg": "rgba(245,158,11,0.10)",
      "border": "rgba(245,158,11,0.28)"
    },
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "PRODUCTS-03": {
    "id_suffix": "Only once you have live sales data",
    "html_produce": "Which products are selling and at what margins",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "PRODUCTS-04": {
    "html_name": "Bundle & Packaging Hypotheses",
    "dom_id": "stage-products-04",
    "html_produce": "Ideas for product bundles or packaging changes worth testing",
    "sfrom": "<span class=\"sfrom-live\">↻ Informed by</span> MARKET-03 pricing benchmarks — run after MARKET-03 where possible",
    "sync_gate": {
      "text": "⇦ Sync point — wait for MARKET-03",
      "color": "#22d3ee",
      "bg": "rgba(34,211,238,0.10)",
      "border": "rgba(34,211,238,0.28)"
    },
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "PRODUCTS-05": {
    "id_suffix": "Only once you have live sales data",
    "html_produce": "Demand signals from reviews, returns, and repeat purchase patterns",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "PRODUCTS-06": {
    "id_suffix": "Only once you have live sales data",
    "html_produce": "The key product decisions to make in the next 90 days",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "PRODUCTS-07": {
    "highlight": true,
    "html_produce": "A single summary of your full product intelligence — the other parts of the loop read from this",
    "swho": [
      {"cls": "bw bw-bot", "text": "🤖 Agent"},
      {"cls": "bw bw-star", "text": "★ Standing doc"},
      {"cls": "bw bw-opt", "text": "Refreshes every 90 days"}
    ]
  },
  "LOGISTICS-01": {
    "html_name": "Supplier & Manufacturer Mapping",
    "html_produce": "Your supplier list with minimum order quantities and lead times",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "LOGISTICS-02": {
    "html_name": "Lead Times & MOQ Baseline",
    "html_produce": "Consolidated stock constraints across all your SKUs",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "LOGISTICS-03": {
    "html_name": "Fulfilment Options",
    "html_produce": "3PL vs self-fulfilment vs dropship — options and trade-offs",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "LOGISTICS-04": {
    "html_name": "Cost & Margin by Route",
    "html_produce": "The full cost stack for each fulfilment channel",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "LOGISTICS-05": {
    "html_name": "Returns & Quality Baseline",
    "html_produce": "Return rates and the most common quality failure modes",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "LOGISTICS-06": {
    "html_produce": "Reorder points and safety stock targets for each SKU",
    "swho": [{"cls": "bw bw-bot", "text": "🤖 Agent"}]
  },
  "LOGISTICS-07": {
    "highlight": true,
    "html_produce": "A single summary of your logistics intelligence — the other parts of the loop read from this",
    "swho": [
      {"cls": "bw bw-bot", "text": "🤖 Agent"},
      {"cls": "bw bw-star", "text": "★ Standing doc"},
      {"cls": "bw bw-opt", "text": "Refreshes every 90 days"}
    ]
  }
}
```

## Notes for TASK-02 implementation

- `dom_id` → `id="..."` attribute on the `.stage` div (required for SVG connector JS)
- `id_suffix` → appended to stage ID in `.sid` as `· <suffix>` (conditional hint)
- `sync_gate` → rendered as `<div class="sync-gate" style="color:...">` after `.sfrom`
- `sfrom` → stored as raw HTML with pre-formatted `<span>` elements (avoids formatSfrom logic)
- `highlight` → adds `highlight` class to `.stage` div
- LOGISTICS stages: `stage.conditional` is true in YAML — use for `.conditional` class
- PRODUCTS-07: NOT conditional in YAML, has `highlight` only
- LOGISTICS-07: conditional (from YAML) AND highlight (from annotation)
