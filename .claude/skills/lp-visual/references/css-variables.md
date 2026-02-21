# CSS Variable Palettes

Four themed palettes for visual HTML documents. Each provides `:root` (light) and `@media (prefers-color-scheme: dark)` overrides.

Select palette based on document domain:
- **operational** — operational guides, email workflows, process docs (green/neutral — default)
- **architecture** — system architecture, dependency graphs, infrastructure docs (terracotta/sage)
- **workflow** — startup loop stages, feature workflows, CI/CD pipelines (teal/cyan)
- **analytics** — KPI dashboards, signal reviews, measurement reports (rose/cranberry)

---

## Palette: operational (default)

Extracted from `docs/guides/brikette-email-system.html`. Green accent with warm neutral background.

```css
:root {
  --bg:          #f9f8f6;
  --surface:     #ffffff;
  --border:      #e4e2de;
  --border-soft: #eeece9;
  --text:        #1a1918;
  --text-muted:  #6b6762;
  --accent:      #2d6a4f;
  --accent-soft: #e8f4ee;
  --warn:        #92400e;
  --warn-soft:   #fef3c7;
  --danger:      #991b1b;
  --danger-soft: #fee2e2;
  --code-bg:     #f3f1ee;
  --code-border: #dbd9d4;
  --radius:      6px;
  --radius-lg:   10px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:          #1a1918;
    --surface:     #242220;
    --border:      #3d3a37;
    --border-soft: #2e2c2a;
    --text:        #f5f3f0;
    --text-muted:  #a39e98;
    --accent:      #52b788;
    --accent-soft: #1e3d30;
    --warn:        #fbbf24;
    --warn-soft:   #27201a;
    --danger:      #f87171;
    --danger-soft: #3b1515;
    --code-bg:     #2e2c2a;
    --code-border: #3d3a37;
  }
}
```

---

## Palette: architecture

Terracotta accent with sage undertones. For system architecture and dependency docs.

```css
:root {
  --bg:          #faf8f5;
  --surface:     #ffffff;
  --border:      #e0dbd4;
  --border-soft: #ebe7e1;
  --text:        #2d2822;
  --text-muted:  #7a7168;
  --accent:      #a0522d;
  --accent-soft: #f5ebe4;
  --warn:        #b45309;
  --warn-soft:   #fef3c7;
  --danger:      #991b1b;
  --danger-soft: #fee2e2;
  --code-bg:     #f0ece6;
  --code-border: #d9d3cb;
  --radius:      6px;
  --radius-lg:   10px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:          #1e1b18;
    --surface:     #28241f;
    --border:      #42392e;
    --border-soft: #332e27;
    --text:        #f2ede7;
    --text-muted:  #a89d93;
    --accent:      #cd7f5c;
    --accent-soft: #3d2518;
    --warn:        #fbbf24;
    --warn-soft:   #27201a;
    --danger:      #f87171;
    --danger-soft: #3b1515;
    --code-bg:     #332e27;
    --code-border: #42392e;
  }
}
```

---

## Palette: workflow

Teal/cyan accent for process and workflow documents.

```css
:root {
  --bg:          #f6fafa;
  --surface:     #ffffff;
  --border:      #d4e4e4;
  --border-soft: #e3eded;
  --text:        #1a2626;
  --text-muted:  #5f7474;
  --accent:      #0d7377;
  --accent-soft: #e0f5f5;
  --warn:        #92400e;
  --warn-soft:   #fef3c7;
  --danger:      #991b1b;
  --danger-soft: #fee2e2;
  --code-bg:     #ecf4f4;
  --code-border: #c9dede;
  --radius:      6px;
  --radius-lg:   10px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:          #141e1e;
    --surface:     #1c2828;
    --border:      #2e4242;
    --border-soft: #243434;
    --text:        #e8f4f4;
    --text-muted:  #8aadad;
    --accent:      #2dd4bf;
    --accent-soft: #0d3333;
    --warn:        #fbbf24;
    --warn-soft:   #27201a;
    --danger:      #f87171;
    --danger-soft: #3b1515;
    --code-bg:     #243434;
    --code-border: #2e4242;
  }
}
```

---

## Palette: analytics

Rose/cranberry accent for data, metrics, and analytics documents.

```css
:root {
  --bg:          #fdf8f8;
  --surface:     #ffffff;
  --border:      #e8d8d8;
  --border-soft: #f0e4e4;
  --text:        #2a1a1a;
  --text-muted:  #7a6060;
  --accent:      #9f1239;
  --accent-soft: #fce7f3;
  --warn:        #92400e;
  --warn-soft:   #fef3c7;
  --danger:      #991b1b;
  --danger-soft: #fee2e2;
  --code-bg:     #f5ecec;
  --code-border: #e0d0d0;
  --radius:      6px;
  --radius-lg:   10px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:          #1e1418;
    --surface:     #281c22;
    --border:      #422e36;
    --border-soft: #33242c;
    --text:        #f5ece8;
    --text-muted:  #ad8e96;
    --accent:      #fb7185;
    --accent-soft: #3d1225;
    --warn:        #fbbf24;
    --warn-soft:   #27201a;
    --danger:      #f87171;
    --danger-soft: #3b1515;
    --code-bg:     #33242c;
    --code-border: #422e36;
  }
}
```

---

## Mermaid themeVariables by Palette

When using `theme: 'base'` in `mermaid.initialize()`, derive themeVariables from the palette CSS variables. See `references/mermaid-init.md` for the full initialization pattern with per-palette mappings.
