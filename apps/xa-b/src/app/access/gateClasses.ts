export const gateClassNames = {
  pageRoot: "relative min-h-dvh overflow-hidden xa-gate-theme",
  pageFrame: "relative mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-6 py-16",
  eyebrow: "text-xs uppercase xa-tracking-030 xa-gate-text-muted",
  eyebrowWide: "text-xs uppercase xa-tracking-035 xa-gate-text-muted",
  eyebrowWidest: "text-xs uppercase xa-tracking-045 xa-gate-text-muted",
  chip: "hidden rounded-full border border-border-2 bg-muted px-3 py-1 xa-text-10 uppercase xa-tracking-040 xa-gate-text-muted md:inline-flex",
  fieldLabel: "block text-xs uppercase xa-tracking-030 xa-gate-text-muted",
  fieldInput:
    "mt-2 h-auto w-full rounded-md border-border-2 bg-surface px-3 py-3 text-sm xa-gate-text-ink placeholder:text-muted-foreground focus:border-foreground focus:ring-foreground/20",
  fieldInputCompact:
    "mt-2 h-auto w-full rounded-md border-border-2 bg-surface px-3 py-2 text-sm xa-gate-text-ink placeholder:text-muted-foreground focus:border-foreground focus:ring-foreground/20",
  primaryButton:
    "h-auto inline-flex items-center gap-2 rounded-md border xa-gate-border-ink xa-gate-bg-ink px-4 py-2 text-sm font-semibold text-primary-fg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
  subtleButton:
    "h-auto min-h-0 rounded-md border border-border-2 px-3 py-1 text-xs uppercase xa-tracking-030 xa-gate-text-ink hover:bg-transparent disabled:opacity-50",
  statusDot: "h-2 w-2 animate-pulse rounded-full xa-gate-bg-ink",
  mutedText: "xa-gate-text-muted",
  inkText: "xa-gate-text-ink",
  tinyMeta: "xa-text-10 uppercase xa-tracking-030 xa-gate-text-muted",
} as const;
