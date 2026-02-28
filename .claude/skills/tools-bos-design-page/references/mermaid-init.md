# Mermaid Initialization

Two initialization modes depending on template type.

## Rich Mode (`theme: 'base'`, palette-driven)

Used in hand-crafted HTML and the `--template rich` pipeline output. Reads CSS variables at runtime so Mermaid colors automatically match the active palette (including dark mode).

```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Read palette CSS variables — Mermaid theme matches whatever palette is active
  var cs = getComputedStyle(document.documentElement);
  var v = function(name, fb) { return cs.getPropertyValue(name).trim() || fb; };

  mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    look: 'classic',
    themeVariables: {
      primaryColor:         v('--accent-soft', dark ? '#1e3d30' : '#e8f4ee'),
      primaryBorderColor:   v('--accent',      '#2d6a4f'),
      primaryTextColor:     v('--text',        dark ? '#f5f3f0' : '#1a1918'),
      secondaryColor:       v('--bg',          dark ? '#1a1918' : '#f9f8f6'),
      secondaryBorderColor: v('--border',      dark ? '#6b6762' : '#e4e2de'),
      tertiaryColor:        v('--warn-soft',   dark ? '#27201a' : '#fef3c7'),
      tertiaryBorderColor:  v('--warn',        '#d97706'),
      lineColor:            v('--text-muted',  dark ? '#6b6762' : '#9ca3af'),
      edgeLabelBackground:  v('--bg',          dark ? '#1a1918' : '#f9f8f6'),
      fontSize: '14px',
    }
  });
</script>
```

### CSS variable → Mermaid themeVariable mapping

| Mermaid themeVariable | CSS variable | Fallback | Purpose |
|-----------------------|-------------|----------|---------|
| `primaryColor` | `--accent-soft` | `#e8f4ee` | Node fill for primary elements |
| `primaryBorderColor` | `--accent` | `#2d6a4f` | Node border for primary elements |
| `primaryTextColor` | `--text` | `#1a1918` | Text inside nodes |
| `secondaryColor` | `--bg` | `#f9f8f6` | Background for secondary elements |
| `secondaryBorderColor` | `--border` | `#e4e2de` | Border for secondary elements |
| `tertiaryColor` | `--warn-soft` | `#fef3c7` | Fill for tertiary/warning elements |
| `tertiaryBorderColor` | `--warn` | `#d97706` | Border for tertiary/warning elements |
| `lineColor` | `--text-muted` | `#9ca3af` | Arrow/edge color |
| `edgeLabelBackground` | `--bg` | `#f9f8f6` | Background behind edge labels |

Because these read from CSS variables, switching palettes (operational, architecture, workflow, analytics, or brand-derived) automatically updates the Mermaid diagram colors. No manual per-palette substitution needed.

## Basic Mode (`theme: 'neutral'`)

Used in the default `--template basic` pipeline output. No dark mode, no custom variables.

```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'antiscript',
    theme: 'neutral'
  });
  // Render only visible (operator) diagrams immediately.
  const operatorDiagrams = Array.from(document.querySelectorAll('.mermaid')).filter(
    (el) => !el.closest("[data-audience='engineering']")
  );
  if (operatorDiagrams.length > 0) {
    mermaid.run({ nodes: operatorDiagrams });
  }
</script>
```

## ELK Layout Engine (Optional)

For diagrams with >20 nodes, load ELK before `mermaid.initialize()`:

```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

  // Conditionally load ELK if any diagram uses it
  const hasElk = Array.from(document.querySelectorAll('.mermaid'))
    .some(el => el.textContent?.includes('defaultRenderer'));
  if (hasElk) {
    const { default: elkLayouts } = await import(
      'https://cdn.jsdelivr.net/npm/@mermaid-js/layout-elk@0/dist/mermaid-layout-elk.esm.min.mjs'
    );
    mermaid.registerLayoutLoaders(elkLayouts);
  }

  mermaid.initialize({ /* ... config ... */ });
</script>
```

Diagrams opt in to ELK with a directive at the top:

```
%%{ init: { 'flowchart': { 'defaultRenderer': 'elk' } } }%%
flowchart TD
  ...
```

See `references/diagram-types.md` for guidance on when to use ELK.

## Hand-Drawn Style (Optional)

Add `look: 'handDrawn'` to `mermaid.initialize()` for sketch-like appearance. Use only for draft/WIP documents.

```js
mermaid.initialize({
  startOnLoad: true,
  theme: 'base',
  look: 'handDrawn',
  // ... themeVariables ...
});
```

## classDef Conventions

Semantic node styling for flowcharts. Use `fill:` with 8-digit hex (last 2 digits = opacity). Never use `color:` in classDef.

```
classDef flowborder fill:#e8f4ee22,stroke:#2d6a4f,stroke-width:1.5px
classDef terminal   fill:#f9f8f633,stroke:#e4e2de,stroke-width:1px
classDef invariant  fill:#fee2e222,stroke:#991b1b,stroke-width:1.5px
classDef good       fill:#e8f4ee33,stroke:#2d6a4f,stroke-width:1.5px
classDef gate       fill:#ede9fe33,stroke:#5b21b6,stroke-width:1.5px
classDef locked     fill:#fef3c733,stroke:#d97706,stroke-width:2px
classDef danger     fill:#fee2e233,stroke:#991b1b,stroke-width:1.5px
classDef outcome    fill:#e8f4ee33,stroke:#2d6a4f,stroke-width:1px
classDef error      fill:#fee2e233,stroke:#991b1b,stroke-width:1.5px
classDef sent       fill:#f9f8f633,stroke:#e4e2de,stroke-width:1px
```
