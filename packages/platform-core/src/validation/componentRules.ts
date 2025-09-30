import { z } from "zod";
import { pageComponentSchema, type PageComponent } from "@acme/types";

export type ValidationIssue = { path: Array<string | number>; message: string };
export type ValidationResult = { ok: true } | { ok: false; errors: string[]; issues?: ValidationIssue[] };

type WithChildren = { children?: unknown };

function getChildren(node: PageComponent): PageComponent[] | undefined {
  const maybeChildren = (node as unknown as WithChildren).children;
  if (Array.isArray(maybeChildren)) return maybeChildren as PageComponent[];
  return undefined;
}

function walk(
  node: PageComponent,
  fn: (n: PageComponent, depth: number, path: Array<string | number>) => void,
  depth = 0,
  path: Array<string | number> = [],
): void {
  if (!node || typeof node !== "object") return;
  fn(node, depth, path);
  const children = getChildren(node);
  if (children) children.forEach((c, i) => walk(c, fn, depth + 1, [...path, "children", i]));
}

function isHazardViewportUnit(v?: string | number | null): boolean {
  if (typeof v !== "string") return false;
  const s = v.trim();
  return /\b(100vw|100vh)\b/.test(s);
}

// Zod-based creation-time validation wrapper around PageComponent[]
const creationComponentsSchema = z.array(pageComponentSchema).superRefine((components, ctx) => {
  // A curated allowlist of container-like component types that may own children
  // Keep in sync with builder rules; safe to accept superset (stricter is done via client drop rules)
  const CONTAINER_TYPES = new Set([
    "Section",
    "Canvas",
    "MultiColumn",
    "StackFlex",
    "Grid",
    "CarouselContainer",
    "TabsAccordionContainer",
    "Tabs",
    "Dataset",
    "Repeater",
    "Bind",
  ] as const as string[]);

  const COLOR_KEYS = new Set([
    "color",
    "backgroundColor",
    "borderColor",
    "outlineColor",
    "fill",
    "stroke",
  ]);

  const isRawColor = (v: unknown): boolean => {
    if (typeof v !== "string") return false;
    const s = v.trim();
    if (!s) return false;
    // Allow CSS variables and common keywords
    if (s.startsWith("var(") || s === "currentColor" || s === "transparent" || s === "inherit" || s === "initial") return false;
    // Detect hex/rgb/hsl colors
    if (s.startsWith("#")) return true;
    if (/^rgba?\(/i.test(s)) return true;
    if (/^hsla?\(/i.test(s)) return true;
    return false;
  };

  components.forEach((root, idx) => {
    // A) Forbid absolute positioning at template root
    if ((root as unknown as { position?: unknown }).position === "absolute") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Root component '${root.type}' should not use absolute positioning in templates.`,
        path: [idx, "position"],
      });
    }

    // B) Disallow 100vw/100vh in width/height and margin/padding anywhere in the tree
    let flagged = false;
    walk(root, (n, _d, p) => {
      if (flagged) return;
      const r = n as unknown as Record<string, unknown>;
      const sizeKeys = [
        "width",
        "widthDesktop",
        "widthTablet",
        "widthMobile",
        "height",
        "heightDesktop",
        "heightTablet",
        "heightMobile",
        "margin",
        "marginDesktop",
        "marginTablet",
        "marginMobile",
        "padding",
        "paddingDesktop",
        "paddingTablet",
        "paddingMobile",
      ];
      for (const k of sizeKeys) {
        if (isHazardViewportUnit(r[k] as string | number | undefined)) {
          flagged = true;
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Component '${root.type}' uses disallowed viewport unit in '${String(k)}'. Avoid 100vw/100vh.`,
            path: [idx, ...p, k],
          });
          break;
        }
      }
    });

    // C) Media aspect/crop required for Image components (prefer fixed aspect)
    walk(root, (n, _d, p) => {
      if ((n as { type?: string }).type === "Image") {
        const aspect = (n as unknown as Record<string, unknown>)["cropAspect"] as unknown;
        const hasAspect = typeof aspect === "string" && aspect.trim().length > 0;
        if (!hasAspect) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Image components should specify 'cropAspect' to enforce aspect ratio.",
            path: [idx, ...p, "cropAspect"],
          });
        } else if (!/^\d+:\d+$/.test(aspect as string)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Image 'cropAspect' should be in 'W:H' format like '16:9' or '4:3'.",
            path: [idx, ...p, "cropAspect"],
          });
        }
      }
    });

    // D) Sticky requires stickyOffset
    walk(root, (n, _d, p) => {
      const r = n as unknown as Record<string, unknown> & { sticky?: string };
      if (r.sticky && (r["stickyOffset"] === undefined || r["stickyOffset"] === null || String(r["stickyOffset"]).trim() === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "When 'sticky' is set, 'stickyOffset' is required.",
          path: [idx, ...p, "stickyOffset"],
        });
      }
    });

    // E) Click action requirements
    walk(root, (n, _d, p) => {
      const r = n as unknown as { clickAction?: string; href?: string; modalHtml?: string };
      if (r.clickAction === "navigate" && (!r.href || !String(r.href).trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "clickAction 'navigate' requires 'href'.",
          path: [idx, ...p, "href"],
        });
      }
      if (r.clickAction === "open-modal" && (!r.modalHtml || !String(r.modalHtml).trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "clickAction 'open-modal' requires 'modalHtml'.",
          path: [idx, ...p, "modalHtml"],
        });
      }
    });

    // F) Min/max item constraints and device items within bounds
    walk(root, (n, _d, p) => {
      const r = n as unknown as { minItems?: number; maxItems?: number; desktopItems?: number; tabletItems?: number; mobileItems?: number };
      if (typeof r.minItems === "number" && typeof r.maxItems === "number" && r.minItems > r.maxItems) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "minItems cannot be greater than maxItems.",
          path: [idx, ...p, "minItems"],
        });
      }
      const checks: Array<[keyof typeof r, string]> = [
        ["desktopItems", "desktopItems"],
        ["tabletItems", "tabletItems"],
        ["mobileItems", "mobileItems"],
      ];
      for (const [key, label] of checks) {
        const val = r[key];
        if (typeof val === "number") {
          if (typeof r.minItems === "number" && val < r.minItems) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be ≥ minItems.`, path: [idx, ...p, label] });
          }
          if (typeof r.maxItems === "number" && val > r.maxItems) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be ≤ maxItems.`, path: [idx, ...p, label] });
          }
        }
      }
    });

    // G) Animation semantics: duration required when animation is set (non-none)
    walk(root, (n, _d, p) => {
      const r = n as unknown as { animation?: string; animationDuration?: number };
      if (r.animation && r.animation !== "none" && !(typeof r.animationDuration === "number" && r.animationDuration > 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "When 'animation' is set, a positive 'animationDuration' is required.",
          path: [idx, ...p, "animationDuration"],
        });
      }
    });

    // H) Parallax should be between 0 and 1 (exclusive upper bound 1.0 is allowed)
    walk(root, (n, _d, p) => {
      const r = n as unknown as { parallax?: number };
      if (typeof r.parallax === "number" && (r.parallax <= 0 || r.parallax > 1)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "'parallax' should be > 0 and ≤ 1.",
          path: [idx, ...p, "parallax"],
        });
      }
    });

    // I) Absolute children require a positioned ancestor (relative/sticky) in-tree
    const foundAbsWithoutAncestor: Array<Array<string | number>> = [];
    (function checkAbs(node: PageComponent, positionedAncestor: boolean, p: Array<string | number>) {
      const r = node as unknown as { position?: string };
      const isPositioned = r.position === "relative" || r.position === "sticky";
      const nextPositioned = positionedAncestor || isPositioned;
      if (r.position === "absolute" && !positionedAncestor) {
        foundAbsWithoutAncestor.push([...p, "position"]);
      }
      const children = getChildren(node) || [];
      children.forEach((c, i) => checkAbs(c, nextPositioned, [...p, "children", i]));
    })(root, false, [idx]);
    if (foundAbsWithoutAncestor.length) {
      for (const p of foundAbsWithoutAncestor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Absolute-positioned components must have a positioned (relative/sticky) ancestor in the template.",
          path: p,
        });
      }
    }

    // J) zIndex must only be used with positioned elements
    walk(root, (n, _d, p) => {
      const r = n as unknown as { position?: string; zIndex?: number };
      if (typeof r.zIndex === "number" && (!r.position || (r.position !== "relative" && r.position !== "absolute" && r.position !== "sticky"))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "'zIndex' requires a positioned element (relative/absolute/sticky).",
          path: [idx, ...p, "zIndex"],
        });
      }
    });

    // K) No negative margins in templates
    walk(root, (n, _d, p) => {
      const r = n as unknown as Record<string, unknown>;
      const keys = ["margin", "marginDesktop", "marginTablet", "marginMobile"] as const;
      for (const k of keys) {
        const v = r[k];
        if (typeof v === "string" && /^\s*-/.test(v)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Negative margins are not allowed ('${k}').`, path: [idx, ...p, k] });
          break;
        }
      }
    });

    // K.1) Disallow raw colors on known color-bearing fields; prefer DS tokens (CSS vars)
    walk(root, (n, _d, p) => {
      const r = n as unknown as Record<string, unknown>;
      for (const k of COLOR_KEYS) {
        const v = r[k as keyof typeof r];
        if (isRawColor(v)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Use design tokens (CSS var) instead of raw color in '${k}'.`,
            path: [idx, ...p, k],
          });
        }
      }
    });

    // L) Text components: discourage fixed heights (can clip text)
    walk(root, (n, _d, p) => {
      if ((n as { type?: string }).type === "Text") {
        const r = n as unknown as Record<string, unknown>;
        const keys = ["height", "heightDesktop", "heightTablet", "heightMobile"] as const;
        for (const k of keys) {
          const v = r[k];
          if (typeof v === "string" && v.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Text components should not set '${k}' (can cause clipping).`, path: [idx, ...p, k] });
            break;
          }
        }
      }
    });

    // M) Button components: ensure minimum tap size when using explicit pixel height
    walk(root, (n, _d, p) => {
      if ((n as { type?: string }).type === "Button") {
        const r = n as unknown as Record<string, unknown>;
        const h = r["height"];
        if (typeof h === "string") {
          const hs = h.trim();
          if (hs.endsWith("px")) {
            const numStr = hs.slice(0, -2);
            // Simple numeric string check without regex backtracking concerns
            let dotCount = 0;
            let digitCount = 0;
            for (let i = 0; i < numStr.length; i++) {
              const ch = numStr[i];
              if (ch === ".") {
                dotCount++;
                if (dotCount > 1) {
                  dotCount = 2; // mark invalid
                  break;
                }
              } else if (ch >= "0" && ch <= "9") {
                digitCount++;
              } else {
                dotCount = 2; // mark invalid
                break;
              }
            }
            if (dotCount <= 1 && digitCount > 0) {
              const px = Number(numStr);
              if (Number.isFinite(px) && px < 40) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Button 'height' should be at least 40px for tap size.",
                  path: [idx, ...p, "height"],
                });
              }
            }
          }
        }
      }
    });

    // N) Images should include non-empty alt text
    walk(root, (n, _d, p) => {
      if ((n as { type?: string }).type === "Image") {
        const r = n as unknown as Record<string, unknown>;
        const alt = r["alt"];
        if (!(typeof alt === "string" && alt.trim().length > 0)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Image components should include non-empty 'alt' text.", path: [idx, ...p, "alt"] });
        }
      }
    });

    // O) Limit nesting depth to prevent pathological templates
    let maxDepth = 0;
    walk(root, (_n, depth) => {
      if (depth > maxDepth) maxDepth = depth;
    });
    if (maxDepth > 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Template nesting depth exceeds 8 levels.", path: [idx] });
    }

    // P) Component-type specific rules
    walk(root, (n, _d, p) => {
      const t = (n as { type?: string }).type;
      const r = n as unknown as Record<string, unknown>;
      // ImageSlider: require ≥2 slides when provided; if minItems present, require ≥ minItems (default 2)
      if (t === "ImageSlider") {
        const slides = r["slides"] as unknown;
        if (Array.isArray(slides)) {
          const min = typeof r["minItems"] === "number" ? (r["minItems"] as number) : 2;
          if (slides.length < min) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: `ImageSlider requires at least ${min} slides.`, path: [idx, ...p, "slides"] });
          }
        }
      }
      // ReviewsCarousel: require ≥2 reviews when provided
      if (t === "ReviewsCarousel") {
        const reviews = r["reviews"] as unknown;
        if (Array.isArray(reviews) && reviews.length < 2) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ReviewsCarousel requires at least 2 reviews.", path: [idx, ...p, "reviews"] });
        }
      }
      // TestimonialSlider: require ≥2 testimonials when provided
      if (t === "TestimonialSlider") {
        const testimonials = r["testimonials"] as unknown;
        if (Array.isArray(testimonials) && testimonials.length < 2) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TestimonialSlider requires at least 2 entries.", path: [idx, ...p, "testimonials"] });
        }
      }
      // Gallery: require ≥2 images when provided
      if (t === "Gallery") {
        const images = r["images"] as unknown;
        if (Array.isArray(images) && images.length < 2) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Gallery requires at least 2 images.", path: [idx, ...p, "images"] });
        }
      }
      // ProductCarousel: if mode = manual -> require ≥2 skus; if mode = collection -> require collectionId
      if (t === "ProductCarousel") {
        const mode = r["mode"] as string | undefined;
        if (mode === "manual") {
          const skus = r["skus"] as unknown;
          if (!Array.isArray(skus) || skus.length < 2) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ProductCarousel (manual) requires at least 2 SKUs.", path: [idx, ...p, "skus"] });
          }
        } else if (mode === "collection") {
          const cid = (r["collectionId"] as string | undefined) || "";
          if (!cid.trim()) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ProductCarousel (collection) requires 'collectionId'.", path: [idx, ...p, "collectionId"] });
          }
        }
      }
    });

    // Q) Only container-like components may have children
    walk(root, (n, _d, p) => {
      const r = n as unknown as Record<string, unknown> & { type?: string };
      const kids = getChildren(n);
      if (Array.isArray(kids) && kids.length > 0) {
        const t = String(r.type || "");
        if (!CONTAINER_TYPES.has(t)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Component '${t}' cannot have children; only containers may own children.`,
            path: [idx, ...p, "children"],
          });
        }
      }
    });
  });
});

export function validateComponentRules(components: PageComponent[]): ValidationResult {
  const parsed = creationComponentsSchema.safeParse(components);
  if (parsed.success) return { ok: true };
  const errors = parsed.error.issues.map((i) => i.message);
  const issues: ValidationIssue[] = parsed.error.issues.map((i) => ({ path: i.path, message: i.message }));
  return { ok: false, errors, issues };
}
