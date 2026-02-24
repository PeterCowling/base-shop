---
Type: Task-Artifact
Status: Draft
---

# TASK-03 Spike: Swim-Lane CSS + Cross-Stream Arrows

**Plan:** startup-loop-parallel-container-wiring
**Date:** 2026-02-22
**Status:** Complete
**Feeds:** TASK-04 (HTML swim-lane redesign)

---

## Executive Summary

Swim lanes: use CSS flexbox columns (confirmed viable, additive to existing structure).
Cross-stream arrows: use an SVG overlay positioned absolutely over the `.lane-container` div (chosen over CSS-only and connector-div approaches).
The `.sfrom` text annotation pattern is unaffected and remains inside stage cards as-is.

---

## 1. Current HTML Structure Analysis

The document uses a single-column vertical flow:

```
.page > .flow (flex column, align-items: center, max-width: 1360px)
  └─ .cbox.c-measure          (full-width container)
  └─ .arrow                   (vertical CSS arrow)
  └─ .cbox.c-product          (full-width container)
  └─ .arrow
  └─ .cbox.c-products         (full-width container)
  └─ .arrow
  └─ .cbox.c-logistics        (full-width container, dashed border = conditional)
  └─ .arrow
  └─ .cbox.c-market           (full-width container)
  └─ .arrow
  └─ .fanout                  (two-column grid: 3fr 2fr)
```

The `.fanout` div already demonstrates multi-column layout with `display: grid; grid-template-columns: 3fr 2fr` — this is the pattern to follow for swim lanes.

**Key structural facts:**
- Every direct child of `.flow` is treated as `width: 100%` (because `.flow` has `align-items: center` and items have `width: 100%` set explicitly on `.cbox`, `.arrow`, `.fanout`, etc.)
- The existing `.arrow` CSS (`display: flex; flex-direction: column; align-items: center`) produces a vertical line + CSS triangle. It only works for vertical flow within one column.
- `position: relative` already appears on `.cond-path` and `.gw` — not on containers at page level. There is no positioned ancestor above `.flow` that could serve as an SVG coordinate root without adding one.
- No SVG is used anywhere in the document today. Introducing it is a clean addition with no conflicts.

---

## 2. Approach Evaluation

### Approach A: CSS-Only (absolute/relative positioning + `::before`/`::after`)

**Mechanism:** Add `position: relative` to the lane container. Use `::before` or `::after` pseudo-elements on the source stage card, sized and positioned with `top`, `left`, `width`, `height` to draw a horizontal or diagonal line reaching the target card in another lane. A CSS border-triangle on the target end simulates an arrowhead.

**Problems:**
- The vertical offset between source and target is unknown at CSS time. MARKET-01 sits at the top of lane 1; PRODUCTS-02 sits below PRODUCTS-01 in lane 2. The pixel gap between them is determined by card heights which are content-driven and not fixed.
- CSS cannot read the rendered height of sibling cards in a different lane. There is no way to calculate `top` or `height` values for the connector without hardcoding — which would break whenever card content changes.
- `::before`/`::after` pseudo-elements on `.stage` cards are already implicitly available for future use (e.g., `.sfrom` border-top uses CSS). Overloading them for cross-lane arrows risks conflicts.
- Cross-browser: CSS transforms can produce subpixel rendering inconsistencies on diagonal lines.

**Verdict: Rejected.** CSS-only cannot handle variable vertical offsets across lanes without hardcoded pixel values.

---

### Approach B: SVG Overlay (chosen)

**Mechanism:** A `<svg>` element is positioned absolutely over the `.lane-container` div, with `width: 100%; height: 100%; pointer-events: none; overflow: visible`. It is a sibling of the lane columns inside a `position: relative` wrapper. Arrow paths are drawn as `<line>` or `<path>` elements with `marker-end` arrowhead markers. JavaScript reads `getBoundingClientRect()` of the source and target stage cards at page load (and on resize) to compute the SVG coordinates, then updates the line endpoints.

**Why this works for this document:**
- The SVG layer sits on top of the lane columns without affecting layout flow (`position: absolute; top: 0; left: 0`).
- JS `getBoundingClientRect()` gives exact coordinates of any `.stage` card regardless of card height or content. This handles variable vertical offsets cleanly.
- SVG `<marker>` with `markerUnits="strokeWidth"` produces crisp arrowheads at any scale.
- The dark theme colors (`#30363d` for default connectors, or theme-specific colors) are trivially applied as SVG `stroke` attributes.
- `pointer-events: none` ensures the SVG overlay does not block hover/click on cards.
- `overflow: visible` on the SVG allows arrows that start/end slightly outside the SVG bounding box.

**JS approach (lightweight, no dependencies):**

```javascript
function positionCrossStreamArrow(svgEl, lineEl, sourceId, targetId) {
  const container = svgEl.closest('.lane-container');
  const containerRect = container.getBoundingClientRect();
  const sourceEl = document.getElementById(sourceId);
  const targetEl = document.getElementById(targetId);
  if (!sourceEl || !targetEl) return;

  const src = sourceEl.getBoundingClientRect();
  const tgt = targetEl.getBoundingClientRect();

  // Start: right-center of source card (in SVG coordinate space)
  const x1 = src.right - containerRect.left;
  const y1 = (src.top + src.bottom) / 2 - containerRect.top;

  // End: left-center of target card
  const x2 = tgt.left - containerRect.left;
  const y2 = (tgt.top + tgt.bottom) / 2 - containerRect.top;

  lineEl.setAttribute('x1', x1);
  lineEl.setAttribute('y1', y1);
  lineEl.setAttribute('x2', x2);
  lineEl.setAttribute('y2', y2);
}
```

Called on `DOMContentLoaded` and on `window.resize` (debounced).

**Verdict: Selected.** Handles variable vertical offsets, integrates cleanly with the dark theme, zero layout impact, standard browser support.

---

### Approach C: CSS Flexbox Connector Div Between Lanes

**Mechanism:** Insert a middle "connector" column between lane 1 and lane 2. Stage cards in lane 1 and lane 2 are laid out at the same heights (by matching grid row tracks). A connector div in the middle column draws a horizontal arrow between the matched rows.

**Problems:**
- Requires identical card heights across lanes for the connector to align correctly. In this document, card heights are driven by content (multi-line text, `.sfrom` annotations, `.swho` badge rows). MARKET-01 and PRODUCTS-02 have different content lengths and will not naturally align to the same height.
- Forcing equal heights with `align-items: stretch` would distort cards that have less content.
- Adding a third "connector" column in the grid layout requires special-casing the SELL placeholder column, making the layout `grid-template-columns: 1fr connector 1fr connector 1fr` — complex and fragile.
- The connector div approach only works for horizontally adjacent lanes. When the source is in lane 1 and the target is in lane 2 (skipping lane separation), routing through the connector is clean; but if dependencies cross multiple lanes, the connector approach breaks down.

**Verdict: Rejected.** Content-driven card heights across lanes make vertical alignment for connectors unreliable without JavaScript anyway.

---

## 3. Swim-Lane CSS Design

### Layout Overview

```
.flow (existing flex column)
  ├── .cbox.c-measure          (full-width — MEASURE container)
  ├── .lane-wrapper            (NEW — position: relative root for SVG overlay)
  │     ├── .lane-container    (NEW — flexbox row, three lanes)
  │     │     ├── .lane.lane-market        (MARKET-01..05)
  │     │     ├── .lane.lane-products      (PRODUCT-01, PRODUCTS, LOGISTICS)
  │     │     └── .lane.lane-sell-hint     (placeholder)
  │     └── <svg class="lane-arrows-svg"> (NEW — SVG overlay)
  ├── .lane-join-label         (NEW — "converges at MARKET-06" divider)
  └── .cbox.c-market (MARKET-06 only, full-width)
```

### CSS Snippet

```css
/* ── SWIM LANE WRAPPER (SVG coordinate root) ── */
.lane-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 14px;
}

/* ── LANE CONTAINER ── */
.lane-container {
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: flex-start;  /* lanes grow independently — no forced equal height */
  width: 100%;
  overflow-x: auto;         /* narrow viewport safety */
}

/* ── INDIVIDUAL LANE ── */
.lane {
  flex: 1 1 0;
  min-width: 280px;         /* prevent collapse on narrow viewports */
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(13, 17, 23, 0.4);
  border: 1px solid #21262d;
  border-radius: 10px;
  padding: 12px;
}

/* ── LANE HEADER ── */
.lane-header {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 6px 10px 8px;
  border-radius: 6px;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

/* Lane-specific header colors matching existing container palette */
.lane-market .lane-header   { color: #f87171; background: rgba(153, 27, 27, 0.14); }
.lane-products .lane-header { color: #fb923c; background: rgba(154, 52, 18, 0.14); }
.lane-sell-hint .lane-header { color: #4ade80; background: rgba(22, 101, 52, 0.10); }

/* ── SVG ARROW OVERLAY ── */
.lane-arrows-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 10;
}

/* ── LANE JOIN LABEL (above MARKET-06 full-width block) ── */
.lane-join-label {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #991b1b;
  margin-bottom: 8px;
}
.lane-join-label::before,
.lane-join-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #991b1b;
  opacity: 0.4;
}

/* ── RESPONSIVE: stack lanes vertically on small screens ── */
@media (max-width: 1000px) {
  .lane-container {
    flex-direction: column;
  }
  .lane {
    min-width: unset;
  }
  .lane-arrows-svg {
    display: none;  /* arrows meaningless in stacked layout */
  }
}
```

### Notes on CSS Choices

- `align-items: flex-start` on `.lane-container` is critical. This allows each lane column to be its natural height (driven by card content). If `stretch` were used, all lanes would be forced to the height of the tallest lane — creating ugly whitespace in shorter lanes.
- `min-width: 280px` on `.lane` prevents the flex columns from collapsing below readable width on narrower screens. Combined with `overflow-x: auto` on `.lane-container`, this gives horizontal scroll rather than broken layout.
- The `.lane-arrows-svg` uses `z-index: 10` to sit above lane content. The `pointer-events: none` is mandatory — without it, the SVG would capture mouse events that should reach stage cards.
- SVG arrows are hidden on `max-width: 1000px` (same breakpoint used by the existing responsive rules). In stacked layout, cross-stream relationships are communicated by the `.sfrom` text annotations on the cards themselves.

---

## 4. SVG Arrow HTML + JavaScript Snippet

### HTML (inside `.lane-wrapper`, sibling to `.lane-container`)

```html
<svg class="lane-arrows-svg" id="laneArrowsSvg" aria-hidden="true">
  <defs>
    <marker id="arrow-cross-stream" markerWidth="8" markerHeight="8"
            refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L8,3 z" fill="#d29922" />
    </marker>
    <marker id="arrow-cross-stream-market" markerWidth="8" markerHeight="8"
            refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L8,3 z" fill="#f87171" />
    </marker>
  </defs>
  <!-- MARKET-01 → PRODUCTS-02 cross-stream arrow -->
  <line id="arrow-m01-p02"
        stroke="#d29922" stroke-width="1.5" stroke-dasharray="5,3"
        marker-end="url(#arrow-cross-stream)"
        x1="0" y1="0" x2="0" y2="0" />
  <!-- MARKET-03 → PRODUCTS-04 cross-stream arrow -->
  <line id="arrow-m03-p04"
        stroke="#d29922" stroke-width="1.5" stroke-dasharray="5,3"
        marker-end="url(#arrow-cross-stream)"
        x1="0" y1="0" x2="0" y2="0" />
</svg>
```

### JavaScript (inline `<script>` at bottom of `<body>`)

```javascript
(function() {
  function updateCrossStreamArrows() {
    var svg = document.getElementById('laneArrowsSvg');
    if (!svg) return;
    var container = svg.closest('.lane-wrapper');
    if (!container) return;
    var containerRect = container.getBoundingClientRect();

    var pairs = [
      { lineId: 'arrow-m01-p02', srcId: 'stage-market-01', tgtId: 'stage-products-02' },
      { lineId: 'arrow-m03-p04', srcId: 'stage-market-03', tgtId: 'stage-products-04' }
    ];

    pairs.forEach(function(pair) {
      var line = document.getElementById(pair.lineId);
      var src  = document.getElementById(pair.srcId);
      var tgt  = document.getElementById(pair.tgtId);
      if (!line || !src || !tgt) return;

      var srcRect = src.getBoundingClientRect();
      var tgtRect = tgt.getBoundingClientRect();

      // Start: right edge, vertical center of source card
      var x1 = srcRect.right  - containerRect.left;
      var y1 = (srcRect.top + srcRect.bottom) / 2 - containerRect.top;

      // End: left edge, vertical center of target card
      var x2 = tgtRect.left   - containerRect.left;
      var y2 = (tgt.top  + tgtRect.bottom) / 2 - containerRect.top;

      line.setAttribute('x1', x1.toFixed(1));
      line.setAttribute('y1', y1.toFixed(1));
      line.setAttribute('x2', x2.toFixed(1));
      line.setAttribute('y2', y2.toFixed(1));
    });
  }

  // Run on load and on resize (debounced)
  document.addEventListener('DOMContentLoaded', updateCrossStreamArrows);
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateCrossStreamArrows, 100);
  });
})();
```

### Required: Stage Card ID Attributes

TASK-04 must add `id` attributes to the four stage cards involved in cross-stream arrows. These IDs are only needed on the four specific cards:

```html
<div class="stage" id="stage-market-01"> ... MARKET-01 ... </div>
<div class="stage" id="stage-market-03"> ... MARKET-03 ... </div>
<div class="stage" id="stage-products-02"> ... PRODUCTS-02 ... </div>
<div class="stage" id="stage-products-04"> ... PRODUCTS-04 ... </div>
```

No other changes to existing stage card structure are required.

---

## 5. `.sfrom` Annotation Compatibility

The `.sfrom` pattern is a text annotation rendered inside the `.stage` card:

```css
.sfrom {
  font-size: 12px; color: #8b949e; line-height: 1.6;
  margin-top: 6px; padding-top: 5px;
  border-top: 1px dashed #21262d;
}
```

It uses `.sfrom-seed` (blue) and `.sfrom-live` (green) spans to indicate "seeded from" vs "always reads" relationships. These are human-readable annotations inside cards and are completely orthogonal to the SVG overlay arrows.

The SVG arrows (graphical, between lanes) and `.sfrom` annotations (textual, inside cards) serve different audiences:

- SVG arrows: show the workflow sequencing constraint (MARKET-01 must complete before PRODUCTS-02 can start)
- `.sfrom`: documents the data lineage (PRODUCTS-02 reads from MARKET-01's output)

Both can coexist. TASK-04 should retain all existing `.sfrom` annotations unchanged and add SVG arrows as a separate, additive layer.

**Cross-stream `.sfrom` phrasing to add:** PRODUCTS-02 and PRODUCTS-04 will each receive a `.sfrom` annotation referencing the MARKET stage they depend on. This text annotation is in addition to (not a replacement for) the SVG arrow.

---

## 6. Answers to Spike Questions

### Q1: Can swim lanes be achieved with CSS flexbox columns within the existing HTML structure?

**Yes.** The `.flow` element is a `flex-direction: column` container. A new `.lane-wrapper > .lane-container` (flexbox row) can be inserted as a direct child of `.flow` between the MEASURE block and the MARKET-06 block. The three lane columns (`flex: 1 1 0`, `min-width: 280px`) inside `.lane-container` hold the MARKET stages, PRODUCTS+LOGISTICS stages, and SELL placeholder respectively. This is purely additive — no existing CSS classes need modification.

### Q2: How should cross-stream dependency arrows be rendered?

**SVG overlay** (Approach B). Reasons:

1. Card heights are content-driven and cannot be known at CSS authoring time — JavaScript `getBoundingClientRect()` is the only reliable way to get vertical positions.
2. SVG `<line>` with `marker-end` arrowheads is the cleanest, most cross-browser-consistent approach.
3. The SVG layer is `pointer-events: none`, `position: absolute`, and `overflow: visible` — zero layout impact.
4. The dark amber dashed style (`stroke="#d29922" stroke-dasharray="5,3"`) matches the document's existing amber/warning color used for soft gates and advisory notes, making the cross-stream dependency arrows visually distinct from the primary flow arrows (`.arrow-line` in `#30363d`).

CSS-only was rejected because it cannot handle variable vertical offsets. Connector-div was rejected because it requires same-height card alignment across lanes.

### Q3: Does the chosen arrow approach work with the existing `.sfrom` annotation pattern?

**Yes, without conflict.** The SVG overlay is a graphical layer positioned above the lane columns. The `.sfrom` text annotations remain inside stage cards, unchanged. They serve complementary purposes: SVG arrows show ordering constraints; `.sfrom` annotations show data lineage. Both must be present in TASK-04's output.

### Q4: CSS snippet for swim lanes

See Section 3 above. Key declarations:

```css
.lane-wrapper   { position: relative; width: 100%; margin-bottom: 14px; }
.lane-container { display: flex; flex-direction: row; gap: 16px; align-items: flex-start; width: 100%; overflow-x: auto; }
.lane           { flex: 1 1 0; min-width: 280px; display: flex; flex-direction: column; gap: 8px; background: rgba(13,17,23,0.4); border: 1px solid #21262d; border-radius: 10px; padding: 12px; }
.lane-arrows-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; z-index: 10; }
```

### Q5: HTML/CSS/SVG snippet for one cross-stream arrow

```html
<!-- Inside .lane-wrapper, sibling to .lane-container -->
<svg class="lane-arrows-svg" id="laneArrowsSvg" aria-hidden="true">
  <defs>
    <marker id="cross-arrow" markerWidth="8" markerHeight="8"
            refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L8,3 z" fill="#d29922" />
    </marker>
  </defs>
  <line id="arrow-m01-p02"
        stroke="#d29922" stroke-width="1.5" stroke-dasharray="5,3"
        marker-end="url(#cross-arrow)"
        x1="0" y1="0" x2="0" y2="0" />
</svg>
```

```javascript
// Positions the line after DOM is ready (see Section 4 for full script)
document.addEventListener('DOMContentLoaded', updateCrossStreamArrows);
```

The `x1/y1/x2/y2` attributes start at `0,0,0,0` and are populated by the JS function. The SVG `overflow: visible` ensures the line is visible even if endpoints land outside the SVG bounding box.

### Q6: Known Limitations

1. **JavaScript required.** If the page is viewed with JS disabled, cross-stream arrows will not be visible (lines stay at `0,0,0,0`). Mitigation: the `.sfrom` text annotations inside cards communicate the same dependency information in text form — so the page remains readable without JS arrows.

2. **Arrows are straight lines.** SVG `<line>` draws a straight path. If MARKET-01 and PRODUCTS-02 have a large vertical offset (PRODUCTS-02 is significantly lower in its lane), the line will appear diagonal. This is acceptable and visually communicates the cross-stream dependency clearly. A curved `<path>` (S-curve) could improve aesthetics but adds implementation complexity not warranted for TASK-04's scope.

3. **Responsive: arrows hidden below 1000px.** On narrow viewports where the lane container stacks vertically, the SVG overlay is `display: none`. Cross-stream dependency information is conveyed only by `.sfrom` text in this breakpoint.

4. **Resize handling is debounced at 100ms.** Fast window resizes may momentarily show misaligned arrows during the debounce window. This is an acceptable trade-off for a documentation-only HTML file.

5. **SELL lane is a placeholder only.** The SELL stages (SELL-01..07) remain below MARKET-06 in the fan-out-1 structure. The SELL column in the swim lane section contains only a header and a brief explanatory text — no stage cards. This means there are no cross-stream arrows to/from the SELL column in the parallel section, simplifying the SVG implementation.

6. **`getBoundingClientRect()` returns viewport-relative coordinates.** The JS converts these to container-relative coordinates by subtracting `containerRect.left` and `containerRect.top`. This is correct as long as `.lane-wrapper` has `position: relative` (which the CSS above provides). If the container has `transform` applied, coordinates may be wrong — not an issue in this document.

---

## 7. TASK-04 Implementation Checklist

TASK-04 can proceed without CSS uncertainty. The implementation steps, in order:

1. Add the CSS block from Section 3 to the `<style>` block (after the existing responsive block at line 437).
2. In the HTML body, after the MEASURE container (`#s-measure`) and its exit `.arrow`, insert the `.lane-wrapper` containing `.lane-container` with three `.lane` children.
3. Move PRODUCT-01 (`#s-product` body) into the `lane-products` column.
4. Move PRODUCTS-01..07 (`#s-products` body) into the `lane-products` column.
5. Move LOGISTICS-01..07 (`#s-logistics` body) into the `lane-products` column (below PRODUCTS block).
6. Move MARKET-01..05 into the `lane-market` column (MARKET-06 stays full-width below the lanes).
7. Add a SELL placeholder card to `lane-sell-hint` explaining that SELL stages start at fan-out-1 after MARKET-06.
8. Add the `.lane-arrows-svg` SVG element as the last child of `.lane-wrapper`.
9. Add `id="stage-market-01"`, `id="stage-market-03"`, `id="stage-products-02"`, `id="stage-products-04"` to the relevant `.stage` divs.
10. Add the JS `<script>` block at the bottom of `<body>` (before `</body>`).
11. Add `.lane-join-label` div between `.lane-wrapper` and the MARKET-06 block.
12. Open in browser; verify three lanes render, arrows draw correctly, conditional stages retain their dashed borders and `.conditional` class.
13. Resize window below 1000px; verify lanes stack vertically and SVG arrows are hidden.
