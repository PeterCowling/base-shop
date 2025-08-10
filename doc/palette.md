# Design Palette

The base and dark themes share a minimal colour system built around WCAG AA contrast requirements (4.5:1 for normal text).

| Token | Light mode value | Dark mode value | Contrast pair |
|-------|-----------------|-----------------|---------------|
| `--color-bg` / `--color-fg` | `0 0% 100%` / `0 0% 10%` | `0 0% 4%` / `0 0% 93%` | 17.49, 16.91 |
| `--color-primary` / `--color-primary-fg` | `220 90% 56%` / `0 0% 100%` | `220 90% 66%` / `0 0% 10%` | 4.57, 5.55 |
| `--color-accent` / `--color-accent-fg` | `260 83% 70%` / `0 0% 10%` | `260 83% 70%` / `0 0% 10%` | 5.14, 5.14 |

All contrast ratios were measured using the relative luminance method and meet WCAG AA for normal text.
