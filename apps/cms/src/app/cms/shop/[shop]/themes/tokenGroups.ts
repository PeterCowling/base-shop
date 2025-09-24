export const tokenGroups: Record<string, string[]> = {
  "Surfaces & Text": [
    "--color-bg-1",
    "--color-bg-2",
    "--color-bg-3",
    "--color-bg-4",
    "--color-bg-5",
    "--color-panel",
    "--color-inset",
    "--color-border",
    "--color-border-strong",
    "--color-border-muted",
    "--color-fg",
    "--color-fg-muted",
    // Keep legacy keys at end for continuity
    "--color-bg",
  ],
  "Primary & Accent": [
    "--color-primary-soft",
    "--color-primary",
    "--color-primary-hover",
    "--color-primary-active",
    "--color-primary-fg",
    "--color-accent-soft",
    "--color-accent",
    "--color-accent-fg",
  ],
  "Status colors": [
    "--color-success-soft",
    "--color-success",
    "--color-success-fg",
    "--color-info-soft",
    "--color-info",
    "--color-info-fg",
    "--color-warning-soft",
    "--color-warning",
    "--color-warning-fg",
    "--color-danger-soft",
    "--color-danger",
    "--color-danger-fg",
  ],
  "Interaction": [
    "--color-focus-ring",
    "--color-selection",
    "--color-highlight",
    "--color-link",
  ],
  "Overlays": [
    "--overlay-scrim-1",
    "--overlay-scrim-2",
  ],
};

export type TokenGroups = typeof tokenGroups;
