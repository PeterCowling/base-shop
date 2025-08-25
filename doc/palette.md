# Design Palette

The base and dark themes share a minimal colour system built around WCAG AA contrast requirements (4.5:1 for normal text).

| Token | Light mode value | Dark mode value | Contrast pair |
|-------|-----------------|-----------------|---------------|
| `--color-bg` / `--color-fg` | `0 0% 100%` / `0 0% 10%` | `0 0% 4%` / `0 0% 93%` | 17.49, 16.91 |
| `--color-primary` / `--color-primary-fg` | `220 90% 56%` / `0 0% 100%` | `220 90% 66%` / `0 0% 10%` | 4.57, 5.55 |
| `--color-accent` / `--color-accent-fg` | `260 83% 70%` / `0 0% 10%` | `260 83% 70%` / `0 0% 10%` | 5.14, 5.14 |
| `--color-success` / `--color-success-fg` | `142 76% 97%` / `142 72% 30%` | `142 72% 27%` / `142 70% 94%` | 4.58, 5.22 |
| `--color-warning` / `--color-warning-fg` | `40 90% 96%` / `25 85% 31%` | `35 90% 30%` / `40 90% 96%` | 6.49, 5.52 |
| `--color-info` / `--color-info-fg` | `210 90% 96%` / `210 90% 35%` | `210 90% 35%` / `210 90% 96%` | 6.31, 6.31 |

All contrast ratios were measured using the relative luminance method and meet WCAG AA for normal text.

## Theme generator

A helper script can create a token map from a single brand colour. The
primary value may be supplied in hex or HSL format:

```sh
pnpm ts-node scripts/src/generate-theme.ts "#1e40af"
```

The output includes the base theme tokens with the primary colour and its
dark variant adjusted.

### Using during shop setup

Running `pnpm run init-shop` now prompts for an optional brand colour. When
provided, the generated overrides are written to
`data/shops/<id>/shop.json` under `themeOverrides`:

```json
{
  "themeOverrides": {
    "--color-primary": "220 90% 56%",
    "--color-primary-dark": "220 90% 66%"
  }
}
```

These overrides are merged with the base palette at runtime.
