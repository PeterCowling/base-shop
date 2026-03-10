/**
 * Shared style constants for XA Catalog Console.
 * Single source of truth for input, button, label, and panel patterns.
 */

// ─── Inputs ────────────────────────────────────────────────────────

/** Standard form input with label above (includes mt-2 gap) */
export const INPUT_CLASS =
  "mt-2 w-full rounded-md border border-gate-border bg-gate-input px-3 py-2 text-sm text-gate-ink placeholder:text-gate-muted transition-colors focus:border-gate-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-gate-accent focus-visible:ring-offset-1";

/** Inline input for detail grids (no mt-2) */
export const INPUT_INLINE_CLASS =
  "w-full rounded-md border border-gate-border bg-gate-input px-3 py-2 text-sm text-gate-ink placeholder:text-gate-muted transition-colors focus:border-gate-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-gate-accent focus-visible:ring-offset-1";

/** Select dropdown (includes disabled state) */
export const SELECT_CLASS =
  "mt-2 w-full rounded-md border border-gate-border bg-gate-input px-3 py-2 text-sm text-gate-ink transition-colors focus:border-gate-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-gate-accent focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60";

// ─── Buttons ───────────────────────────────────────────────────────

/** Primary action (accent bg, white text) */
export const BTN_PRIMARY_CLASS =
  "rounded-md bg-gate-accent px-4 py-2 text-xs font-semibold uppercase tracking-label text-gate-on-accent transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gate-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/** Secondary action (border, muted text → accent on hover) */
export const BTN_SECONDARY_CLASS =
  "rounded-md border border-gate-border px-3 py-2 text-xs uppercase tracking-label text-gate-muted transition hover:border-gate-accent hover:text-gate-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gate-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/** Accent outline (accent border+text, soft bg on hover) */
export const BTN_ACCENT_OUTLINE_CLASS =
  "rounded-md border border-gate-accent px-3 py-2 text-xs uppercase tracking-label text-gate-accent transition hover:bg-gate-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gate-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/** Success/confirmed action (saved state) */
export const BTN_SUCCESS_CLASS =
  "rounded-md border border-success-fg bg-success-bg px-4 py-2 text-xs font-semibold uppercase tracking-label text-success-fg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-fg focus-visible:ring-offset-2";

/** Danger/destructive action */
export const BTN_DANGER_CLASS =
  "rounded-md border border-danger px-3 py-1 text-xs uppercase tracking-label text-danger-fg transition hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

// ─── Checkboxes ────────────────────────────────────────────────────

/** Design-system-compliant checkbox (gate-* tokens, matches RegistryCheckboxGrid) */
export const CHECKBOX_CLASS =
  "rounded border-gate-border text-gate-accent accent-gate-accent focus:ring-gate-accent";

// ─── Labels & Headers ──────────────────────────────────────────────

/** Standard field label (uppercase, muted) */
export const FIELD_LABEL_CLASS = "block text-xs uppercase tracking-label text-gate-muted";

/** Section header divider (Identity, Taxonomy, Commercial) */
export const SECTION_HEADER_CLASS =
  "border-t border-gate-border pt-4 text-xs font-semibold uppercase tracking-label-lg text-gate-accent";

// ─── Panels ────────────────────────────────────────────────────────

/** Card/panel container */
export const PANEL_CLASS = "rounded-xl border border-gate-border bg-gate-surface p-6 shadow-elevation-2";

// ─── Skeletons ─────────────────────────────────────────────────────

/** Inline skeleton block: surface fill + visible border + reduced-motion-safe pulse */
export const SKELETON_BLOCK_CLASS =
  "bg-gate-surface border border-gate-border rounded-md animate-pulse motion-reduce:animate-none";
