<!-- /src/styles/AGENTS.md -->

# Agents – Styles & Palette

## 1 · Tailwind setup

- Tailwind **4.1.7** in JIT mode.
- App config in `apps/brikette/tailwind.config.mjs` (referenced via `@config`).
- Dark mode uses `.theme-dark` on `<html>` (matches Tailwind `darkMode`).
- Global layers live in `src/styles/global.css`.

---

## 2 · Colour tokens

### Light theme (`:root`)

| Token                   | Hex       |
| ----------------------- | --------- |
| `--color-primary`       | `#00629A` |
| `--color-secondary`     | `#F4D35E` |
| `--color-accent-1`      | `#C4572E` |
| `--color-accent-2`      | `#C1364D` |
| `--color-neutral-light` | `#FFFFFF` |
| `--color-neutral-mid`   | `#F2F3F4` |
| `--color-neutral-dark`  | `#1B1B1B` |
| `--gradient-start`      | `#003D73` |
| `--gradient-mid`        | `#005C9C` |
| `--gradient-end`        | `#00629A` |

### Dark theme (`.theme-dark`)

| Token                     | Hex       |
| ------------------------- | --------- |
| `--color-primary`         | `#9F6B00` |
| `--color-secondary`       | `#D2B53F` |
| `--color-accent-1`        | `#FF5722` |
| `--color-accent-2`        | `#FFEB3B` |
| `--color-neutral-light`\* | `#F7F7F7` |
| `--color-neutral-mid`\*   | `#1F1F1F` |
| `--color-neutral-dark`\*  | `#181818` |
| `--gradient-start`        | `#000000` |
| `--gradient-mid`          | `#1B1B1B` |
| `--gradient-end`          | `#2B2B2B` |

\* Map to `bg`, `surface`, `text` semantic tokens.  
All light-mode colours meet **WCAG 2.2** contrast ≥ 4.5 : 1 against white.

---

## 3 · Global helpers

- Use `@apply` for small utility groups.
- Avoid nesting `@apply` inside media queries; prefer responsive utilities.
- Custom media queries live in `apps/brikette/tailwind.config.mjs → theme.screens`.
