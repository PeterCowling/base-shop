export type Issue = { path: Array<string | number>; message: string };

// Minimal resolver to map common field keys to panel/section labels for the sidebar.
// This is a best-effort hint; fields may be rendered in different panels depending on the component type.
export function resolveIssueLabel(
  issue: Issue,
  t?: (key: string) => string,
): { panel: string; field: string; path: string } {
  const path = issue.path.slice(1); // drop root index used by server
  const key = typeof path[path.length - 1] === "string" ? (path[path.length - 1] as string) : String(path[path.length - 1]);
  const pathString = path.join(".");
  const PANEL_KEY_MAP: Record<string, string> = {
    // Layout
    width: "cms.builder.layout.size",
    widthDesktop: "cms.builder.layout.size",
    widthTablet: "cms.builder.layout.size",
    widthMobile: "cms.builder.layout.size",
    height: "cms.builder.layout.size",
    heightDesktop: "cms.builder.layout.size",
    heightTablet: "cms.builder.layout.size",
    heightMobile: "cms.builder.layout.size",
    position: "cms.builder.layout.position",
    top: "cms.builder.layout.position",
    left: "cms.builder.layout.position",
    sticky: "cms.builder.layout.position",
    stickyOffset: "cms.builder.layout.position",
    zIndex: "cms.builder.layout.zIndex",
    margin: "cms.builder.layout.spacing",
    marginDesktop: "cms.builder.layout.spacing",
    marginTablet: "cms.builder.layout.spacing",
    marginMobile: "cms.builder.layout.spacing",
    padding: "cms.builder.layout.spacing",
    paddingDesktop: "cms.builder.layout.spacing",
    paddingTablet: "cms.builder.layout.spacing",
    paddingMobile: "cms.builder.layout.spacing",
    // Content / Media
    cropAspect: "cms.builder.content.image",
    alt: "cms.builder.content.image",
    // Interactions
    clickAction: "cms.builder.interactions",
    href: "cms.builder.interactions.navigate",
    modalHtml: "cms.builder.interactions.modal",
    parallax: "cms.builder.interactions.effects",
    animation: "cms.builder.interactions.animation",
    animationDuration: "cms.builder.interactions.animation",
    // Timeline
    timeline: "cms.builder.timeline",
  };
  const panelKey = PANEL_KEY_MAP[key] || "cms.builder.unknown";
  const panel = typeof t === "function" ? t(panelKey) : panelKey;
  return { panel, field: key, path: pathString };
}
