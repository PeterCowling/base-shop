// apps/cms/src/app/cms/shop/[shop]/themes/usageMap.ts
// Human-readable usage hints per semantic token.

export const tokenUsage: Record<string, string[]> = {
  "--color-bg-1": ["App background", "Body"],
  "--color-bg-2": ["Subtle background", "Stripes"],
  "--color-bg-3": ["Surfaces", "Cards"],
  "--color-bg-4": ["Hover surfaces"],
  "--color-bg-5": ["Active surfaces"],
  "--color-panel": ["Elevated containers", "Popovers"],
  "--color-inset": ["Inputs", "Inset wells"],
  "--color-border": ["Default borders"],
  "--color-border-strong": ["Emphasis borders"],
  "--color-border-muted": ["Subtle dividers"],
  "--color-fg": ["Body text", "Headings"],
  "--color-fg-muted": ["Secondary text", "Captions"],
  "--color-primary-soft": ["Primary tinted backgrounds", "Badges (subtle)"],
  "--color-primary": ["Primary buttons", "Chips (filled)", "Switch ON"],
  "--color-primary-hover": ["Primary hover"],
  "--color-primary-active": ["Primary active"],
  "--color-primary-fg": ["On-primary text"],
  "--color-accent-soft": ["Accent tinted backgrounds"],
  "--color-accent": ["Accent buttons", "Links (emphasis)"],
  "--color-accent-fg": ["On-accent text"],
  "--color-success-soft": ["Success banners (soft)"],
  "--color-success": ["Success badges", "Success alerts (solid)"],
  "--color-success-fg": ["On-success text"],
  "--color-info-soft": ["Info banners (soft)"],
  "--color-info": ["Info badges", "Info alerts (solid)"],
  "--color-info-fg": ["On-info text"],
  "--color-warning-soft": ["Warning banners (soft)"],
  "--color-warning": ["Warning badges", "Warning alerts (solid)"],
  "--color-warning-fg": ["On-warning text"],
  "--color-danger-soft": ["Danger banners (soft)"],
  "--color-danger": ["Danger badges", "Errors"],
  "--color-danger-fg": ["On-danger text"],
  "--color-focus-ring": ["Focus ring"],
  "--color-selection": ["Text selection"],
  "--color-highlight": ["Highlights", "KBD backgrounds"],
  "--color-link": ["Links"],
  "--overlay-scrim-1": ["Modals", "Drawers"],
  "--overlay-scrim-2": ["Modals (heavy)", "Lightbox"],
};

export function getUsageText(token: string): string | null {
  const uses = tokenUsage[token];
  if (!uses || uses.length === 0) return null;
  return `${token} → ${uses.join(", ")}`;
}

