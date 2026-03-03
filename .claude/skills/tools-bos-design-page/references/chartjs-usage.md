# Chart.js KPI Dashboards

Chart.js renders interactive charts via `<canvas>` elements in self-contained HTML documents. Charts are defined using ` ```chart ` code fences in `.user.md` files. The render pipeline transforms these fences into `<pre class="chart">` blocks, which the `chartjs-loader.html` partial processes at runtime.

**CDN:** `https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js`

---

## The ` ```chart ` Code Fence Format

Each fence contains a JSON object that maps 1:1 to the Chart.js configuration API.

**Required keys:** `type`, `data`
**Optional keys:** `options`, `height`

- `height` — sets the container height in CSS units (default `300px`). Consumed by the loader; not passed to Chart.js.
- `options` — standard Chart.js options object. Use for titles, legends, scales, tooltips.

---

## Supported Chart Types

### Line chart — S10 weekly revenue trend

```chart
{
  "type": "line",
  "data": {
    "labels": ["W05", "W06", "W07", "W08"],
    "datasets": [{
      "label": "Revenue (EUR)",
      "data": [120, 340, 280, 450],
      "borderColor": "#2d6a4f",
      "tension": 0.3
    }]
  },
  "options": {
    "plugins": {
      "title": { "display": true, "text": "Weekly Revenue" }
    }
  }
}
```

### Bar chart — Signal review template usage

```chart
{
  "type": "bar",
  "data": {
    "labels": ["T01-Inquiry", "T03-Directions", "T05-Checkout", "T12-Cancellation"],
    "datasets": [{
      "label": "Selections",
      "data": [42, 28, 15, 8],
      "backgroundColor": "#2d6a4f"
    }]
  },
  "options": {
    "plugins": {
      "title": { "display": true, "text": "Template Usage by Selection Count" }
    }
  }
}
```

### Doughnut chart — Conversion funnel

```chart
{
  "type": "doughnut",
  "data": {
    "labels": ["Visitors", "Add to Cart", "Checkout", "Purchase"],
    "datasets": [{
      "data": [1000, 320, 180, 95],
      "backgroundColor": ["#e8f4ee", "#52b788", "#2d6a4f", "#1e3d30"]
    }]
  },
  "options": {
    "plugins": {
      "title": { "display": true, "text": "Conversion Funnel" }
    }
  }
}
```

---

## Palette Integration

The `chartjs-loader.html` partial reads CSS variables at runtime via `getComputedStyle()`:

| CSS Variable | Chart.js Default | Usage |
|---|---|---|
| `--text` | `plugins.legend.labels.color`, `plugins.title.color` | Heading and legend text |
| `--text-muted` | `Chart.defaults.color`, `scale.ticks.color` | Axis labels, tick marks |
| `--border` | `Chart.defaults.borderColor`, `scale.grid.color` | Grid lines, chart borders |
| `--surface` | `Chart.defaults.backgroundColor` | Chart area background |

These defaults provide automatic dark/light mode support without per-chart configuration.

For explicit dataset colors, use the palette's accent scale rather than arbitrary hex values. From the **operational** palette (see `references/css-variables.md`):

| Token | Light | Dark | Use for |
|---|---|---|---|
| `--accent` | `#2d6a4f` | `#52b788` | Primary series, borders |
| `--accent-soft` | `#e8f4ee` | `#1e3d30` | Fills, area backgrounds |
| `--warn` | `#92400e` | `#fbbf24` | Warning/threshold lines |
| `--danger` | `#991b1b` | `#f87171` | Negative/alert series |

For multi-series charts, build a sequence from the accent scale. Example 4-stop gradient for doughnut/pie: `["#e8f4ee", "#52b788", "#2d6a4f", "#1e3d30"]`.

---

## Responsive Sizing

- Default container height: `300px` (override via the `height` key in the fence JSON).
- All charts are rendered with `responsive: true` and `maintainAspectRatio: false` (enforced by the loader, regardless of what the fence JSON specifies).
- Charts resize automatically on window resize.

Example with custom height:

```chart
{
  "type": "bar",
  "height": "200px",
  "data": {
    "labels": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "datasets": [{ "label": "Sessions", "data": [80, 120, 95, 140, 110], "backgroundColor": "#2d6a4f" }]
  },
  "options": {
    "plugins": { "title": { "display": true, "text": "Daily Sessions" } }
  }
}
```

---

## Quality Rules

1. **Prefer tables for fewer than 4 data points** — charts add visual overhead that is not justified for small datasets. Use a simple table or inline numbers instead.
2. **Use charts when trends, comparisons, or distributions need visual emphasis** — time series, category comparisons, and proportional breakdowns benefit from charting.
3. **Always include a title** via `options.plugins.title` with `display: true`. Every chart must be self-describing.
4. **Use `tension: 0.3` for line charts** — produces smoother curves without distorting the data.
5. **Limit datasets to 5 or fewer per chart** — more than 5 series makes the chart unreadable. Split into multiple charts if needed.
6. **Use palette accent colors, not arbitrary hex values** — this ensures consistency across documents and correct appearance in both light and dark mode.
7. **Keep JSON valid** — the loader uses `JSON.parse()` directly. Trailing commas, unquoted keys, or single quotes cause silent failures. Always validate JSON structure.

---

## How the Pipeline Processes Charts

The render pipeline transforms ` ```chart ` fences through several stages:

1. **Markdown parsing** — remark/rehype converts the fenced code block into `<pre><code class="language-chart">{ ... }</code></pre>`.
2. **`transformChartBlocks()`** — the render pipeline rewrites these elements to `<pre class="chart" style="display:none">{ ... }</pre>`. The `display:none` prevents a flash of raw JSON before Chart.js initialises.
3. **Conditional CDN loading** — the `chartjs-loader.html` partial (or an inline script equivalent) is included only when chart blocks exist in the document. If no `<pre class="chart">` blocks are found, the Chart.js CDN script is not loaded.
4. **Runtime rendering** — the loader iterates over all `<pre class="chart">` blocks, parses the JSON, creates a `<canvas>` inside a responsive container `<div>`, replaces the `<pre>`, and instantiates a `Chart` object.
5. **Error handling** — if `JSON.parse()` or Chart.js constructor throws, the `<pre>` is made visible with a red error message, making failures immediately apparent during review.
