# Skylar SRL — Italian Locale Guide

Use this doc alongside the shared `AGENTS.md`. `/it` should feel like a Milan atelier catalogue: editorial, structured, and tactile. It inherits EN’s poster rhythm (oversized hero words, stacked sections) and nods to ZH’s premium finishes (disciplined metallics, high-contrast inking) while remaining unmistakably Italian.

## 1. Design language — “Milan Editorial Posters”

### Palette

| Token | Hex | Usage |
| --- | --- | --- |
| Primary ink | `#941F1E` | Hero words, nav links, CTAs. A deeper, wine-forward take on EN’s warm red. |
| Secondary ink | `#2F221E` | Body copy, dividers, supporting labels—reads as espresso ink for long passages. |
| Biscotto ground | `#F6F0E6` | Default background; slightly textured feeling vs EN’s cream. |
| Oro highlight | `#D8B072` | Highlights, outlines, icons, hover states. Bridges the locale to ZH’s restrained gold detailing. |
| Sage accent | `#5F6F52` | Micro accents (tags, status dots) and focus rings to keep the palette grounded. |

Rules:
- Keep red + espresso as the ink pair; gold only appears as a fine line or typographic accent.
- Maintain high contrast between hero words and the biscotto background—no gradients or photographic fills behind type.
- Use oro highlight to signal premium touchpoints (pricing badges, “Limited drop”) but keep them ≤10% of any section.

### Typography & hierarchy

- Pair a high-contrast fashion serif (e.g., “Canela”, “Fraunces”, “Cormorant Garamond”) for display words with a sharp grotesk (e.g., “Neue Montreal”, “Space Grotesk”) for supporting copy.
- Hero word pattern mirrors EN (all caps, big tracking) but apply Italian editorial cues:
  - Slightly condensed width so long words like “IMMOBILIARE” remain punchy.
  - Tracking sits between EN and ZH: reduce EN spacing by ~12% so words feel denser, but never as tight as the business-card system.
- Body copy is calmer than EN: set 18–20px base (scales via `clamp()`), 1.5 line-height, micro drop caps allowed at the start of hero paragraphs.
- Use italic moments (one or two words) to nod to fashion editorials—especially in testimonials or manifesto snippets.

### Composition & grids

- Sections are “folded spreads”: a hero word sits against the left margin, content columns float to the right with generous gutters.
- Reuse EN’s poster stack rhythm but constrain each block to a soft shadowed card (2–4px blur) to echo magazine layouts.
- Alignment is stricter than EN: use a 12-column grid with obvious baselines; hero words can bleed, but supporting content should snap to columns.
- Borrow ZH’s information density for stat-heavy areas; use labeled rows (e.g., “Anno / Servizio / Stato”) separated by hairline oro dividers.

### Imagery & materiality

- Showcase materials, craft processes, or architectural vignettes—think terrazzo, leather, brushed metal, Amalfi film stills.
- Keep all photography lightly desaturated; overlay a subtle warm filter (`rgba(244, 220, 196, 0.4)`) to unify shots with the biscotto ground.
- Avoid lifestyle clutter. Objects can be cropped dramatically (macro shots) to match editorial spreads.
- When rendering real-estate cards, place blueprint-style lines or typographic captions along the edges to differentiate from EN’s clean posters.

### Motion & interaction

- Motion should feel like turning a page: slow crossfades, vertical reveals, no elastic bounces.
- Hover states: espresso text shifts to red, borders pick up oro; CTAs underline with a 1px oro rule that slides in from the center.
- Focus states reuse the sage accent as a slim outline so accessibility cues remain visible against warm backgrounds.

## 2. Layout & component guidance

### Header & footer

- Same structure as EN (logo · links · language toggle) but:
  - Nav backgrounds stay biscotto; nav text uses espresso with red hover.
  - Divider rules are oro, 0.5px thick, matching ZH’s precision.
- Footer recycles the header typography, adds an oro keyline across the top, and stacks contact info in labeled rows similar to the ZH locale.

### Home structure

1. **Intro spread**: three columns (“Il Flywheel”, “Prodotti”, “Immobiliare”) on biscotto; each column gets a serif title + grotesk paragraph + oro label.
2. **Hero “PRODOTTI”**: hero word bleeds left/right, category cards float as outlined modules with alternating biscotto/white fills. Apply sage dots for filters.
3. **Split duo** (“Design industriale” + “Creato da noi”): treat as mirrored magazine spreads—full-bleed photo vs. copy block, separated by oro rule.
4. **Hero “IMMOBILIARE”**: hero word overlays a subtle architectural line drawing; follow with “Prime location” cards described like property dossiers (fields + signature CTA).

### `/it/products`

- Start with “PRODOTTI” hero block, then a vertical trio:
  - “Design e Ricerca”, “Approvvigionamento & Operazioni”, “Distribuzione & Piattaforme”.
  - Each column contains three data rows (Servizio, Output, Contatto) with oro labels referencing ZH’s contact treatment.
- Catalog grid uses alternating biscotto + parchment tiles; each tile features a macro material photo plus concise Italian body copy.

### `/it/real-estate`

- Hero “Portfolio vivo” card sits inside a thin oro frame, includes a column of stats (Anno, Località, Stato).
- Follow with:
  - Hostel Brikette layout: left column blueprint, right column copy, CTA “Visita Hostel Brikette”.
  - “Comfort & Sperimentazione” stack—two cards capturing how spaces feed product development.

### `/it/people`

- Cards act like Milan fashion house bios: serif name, grotesk role, italic tagline.
- Ensure parity: Cristiana = “Direttrice Progettazione & Approvvigionamento”, Peter = “Direttore Distribuzione & Piattaforme”.
- Contact rows mimic ZH’s labelled format (`Telefono / Email / Sito`), but keep palette biscotto + red.
- Optional portrait silhouettes can sit inside rounded frames with oro outlines.

## 3. Copy & tone

- Voice is precise, confident, and a touch literary. Fewer exclamation marks; instead rely on short declarative statements.
- Use Italian craft vocabulary (“bottega”, “atelier”, “finitura”) where authentic; avoid anglicisms unless it’s a product name.
- CTA verbs stay active but elegant: “Esplora”, “Contatta”, “Prenota”.
- Paragraph length generally mirrors EN (2–4 lines) yet feel free to extend sentences when craft notes or storytelling need the space; still weave in sensory descriptors that connect product craft to place.

## 4. Implementation notes

- `.skylar-shell--it` toggles palette tokens: expose CSS variables (`--it-ink`, `--it-ground`, `--it-gold`, `--it-accent`) so apps map imports to both `src` and `dist`.
- Continue to size text with `clamp()`; Italian paragraphs can be slightly wider than EN, but cap at ~64ch.
- Reuse EN motion utilities but swap easing to `cubic-bezier(0.25, 0.1, 0.25, 1)` for calmer transitions.
- Shared modules (cards, nav, CTAs) should read the locale tokens so EN stays vibrant, IT stays editorial, and ZH stays black-gold without duplicating markup.
