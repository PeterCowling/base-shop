# Pattern Reflection — BASE Theme OKLCH Migration

## Patterns

- **Pre-wrap at source, reference via var()** — Storing full color values (hsl(), oklch())
  at the CSS custom property source makes @theme inline format-agnostic. When changing
  color formats, only the source tokens.ts/tokens.css change; the CSS consumers (globals.css
  @theme inline) require zero changes. This pattern was validated in dispatch 1004 and
  reconfirmed here. Observed twice across two builds.
  - Category: new loop process (validated pattern now embedded in MEMORY.md)
  - Routing: already in MEMORY.md — no further action

## Access Declarations

- `packages/themes/reception/src/tokens.ts` — read + write
- `packages/themes/reception/tokens.css` — read + write
- `apps/reception/src/app/globals.css` — read + write
- `scripts/src/themes/hsl-to-oklch.ts` — created
- `scripts/src/themes/contrast-verify.ts` — created
