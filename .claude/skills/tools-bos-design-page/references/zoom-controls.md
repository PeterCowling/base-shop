# Zoom Controls — CSS + JavaScript

Canonical zoom/pan infrastructure for interactive Mermaid diagrams. Extracted from `docs/guides/brikette-email-system.html`.

## HTML Container Template

Every interactive diagram uses this wrapper:

```html
<div class="mermaid-wrap">
  <div class="zoom-controls">
    <button onclick="zoomDiagram(this,1.2)" title="Zoom in">+</button>
    <button onclick="zoomDiagram(this,0.8)" title="Zoom out">&minus;</button>
    <button onclick="resetZoom(this)" title="Reset zoom">&#8634;</button>
  </div>
  <pre class="mermaid">
    <!-- diagram syntax here -->
  </pre>
</div>
<p class="diagram-caption">Caption text</p>
```

## CSS

Add inside the document `<style>` block. Requires CSS variables from a palette (see `references/css-variables.md`).

```css
/* ── Mermaid diagram containers ── */
.mermaid-wrap {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem 1.2rem 1rem;
  overflow: auto;
  margin: 1rem 0 1.5rem;
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.mermaid-wrap .mermaid {
  transition: transform 0.2s ease;
  transform-origin: top center;
}
.zoom-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 2px;
  z-index: 10;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2px;
}
.zoom-controls button {
  width: 26px; height: 26px;
  border: none; background: transparent;
  color: var(--text-muted);
  font-family: "SF Mono", monospace;
  font-size: 13px; cursor: pointer;
  border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.zoom-controls button:hover {
  background: var(--border);
  color: var(--text);
}
.mermaid-wrap.is-zoomed  { cursor: grab; }
.mermaid-wrap.is-panning { cursor: grabbing; user-select: none; }

/* Force node/edge text to match page colour scheme */
.mermaid .nodeLabel  { color: var(--text) !important; }
.mermaid .edgeLabel  { color: var(--text-muted) !important; }
.mermaid .edgeLabel rect { fill: var(--bg) !important; }

.diagram-caption {
  font-size: 0.78rem;
  color: var(--text-muted);
  text-align: center;
  margin-top: -0.8rem;
  margin-bottom: 1rem;
  font-style: italic;
}

@media (prefers-reduced-motion: reduce) {
  .mermaid-wrap .mermaid { transition: none; }
}
```

## JavaScript

Add before `</body>`. Provides three interaction modes:

1. **Button zoom** — +/- buttons scale 1.2x/0.8x per click, reset returns to 1x
2. **Scroll zoom** — Ctrl/Cmd + mouse wheel, 1.1x/0.9x per tick
3. **Click-drag pan** — active only when zoom > 1x

```html
<script>
  function zoomDiagram(btn, factor) {
    var wrap = btn.closest('.mermaid-wrap');
    var el   = wrap.querySelector('.mermaid');
    var z    = Math.min(Math.max((parseFloat(el.dataset.zoom || '1')) * factor, 0.3), 5);
    el.dataset.zoom = z;
    el.style.transform = 'scale(' + z + ')';
    wrap.classList.toggle('is-zoomed', z > 1);
  }
  function resetZoom(btn) {
    var wrap = btn.closest('.mermaid-wrap');
    var el   = wrap.querySelector('.mermaid');
    el.dataset.zoom = '1';
    el.style.transform = '';
    wrap.classList.remove('is-zoomed');
  }
  document.querySelectorAll('.mermaid-wrap').forEach(function(wrap) {
    /* Ctrl/Cmd + scroll to zoom */
    wrap.addEventListener('wheel', function(e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      var el = wrap.querySelector('.mermaid');
      var z  = Math.min(Math.max((parseFloat(el.dataset.zoom || '1')) * (e.deltaY < 0 ? 1.1 : 0.9), 0.3), 5);
      el.dataset.zoom = z;
      el.style.transform = 'scale(' + z + ')';
      wrap.classList.toggle('is-zoomed', z > 1);
    }, { passive: false });
    /* Click-and-drag panning when zoomed */
    var sx, sy, sl, st;
    wrap.addEventListener('mousedown', function(e) {
      if (e.target.closest('.zoom-controls')) return;
      if (parseFloat(wrap.querySelector('.mermaid').dataset.zoom || '1') <= 1) return;
      wrap.classList.add('is-panning');
      sx = e.clientX; sy = e.clientY;
      sl = wrap.scrollLeft; st = wrap.scrollTop;
    });
    window.addEventListener('mousemove', function(e) {
      if (!wrap.classList.contains('is-panning')) return;
      wrap.scrollLeft = sl - (e.clientX - sx);
      wrap.scrollTop  = st - (e.clientY - sy);
    });
    window.addEventListener('mouseup', function() { wrap.classList.remove('is-panning'); });
  });
</script>
```

## Zoom Range

- Minimum: 0.3x
- Maximum: 5.0x
- Default: 1.0x
- State stored in `data-zoom` attribute on the `.mermaid` element
