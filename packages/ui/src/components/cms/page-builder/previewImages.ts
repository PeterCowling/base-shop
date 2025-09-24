// packages/ui/src/components/cms/page-builder/previewImages.ts
// Tiny SVG generator for palette preview thumbnails (light/dark aware).
// Returns data URLs that depict schematic outlines for sections/containers.

type Size = { w: number; h: number };
type Colors = { bg: string; stroke: string; fill: string; overlay: string };

const CANVAS: Size = { w: 400, h: 225 }; // 16:9 thumbnail

function readToken(name: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return raw || null;
  } catch {
    return null;
  }
}

function hslFromToken(name: string, alpha?: number): string | null {
  const raw = readToken(name);
  if (!raw) return null;
  const a = typeof alpha === "number" ? ` / ${alpha}` : "";
  return `hsl(${raw}${a})`;
}

function getColors(): Colors {
  // Prefer builder CSS tokens for perfect alignment
  const bg = hslFromToken("--color-bg");
  const fg = hslFromToken("--color-fg");
  if (bg && fg) {
    return {
      bg,
      stroke: hslFromToken("--color-fg", 0.45) ?? fg,
      fill: hslFromToken("--color-fg", 0.18) ?? fg,
      overlay: hslFromToken("--color-bg", 0.65) ?? bg,
    } as Colors;
  }
  // Fallback palette
  return {
    bg: "#F8FAFC",
    stroke: "#94A3B8",
    fill: "#E2E8F0",
    overlay: "rgba(248,250,252,0.8)",
  };
}

function svg(parts: string[], size: Size = CANVAS, c: Colors = getColors()): string {
  const body = parts.join("");
  const s = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}" role="img" aria-label="preview">` +
    `<rect x="0" y="0" width="100%" height="100%" fill="${c.bg}"/>` +
    body +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;
}

function rect(x: number, y: number, w: number, h: number, c: Colors, opts: { r?: number; fill?: string; stroke?: string } = {}): string {
  const r = opts.r ?? 8;
  const fill = opts.fill ?? c.fill;
  const stroke = opts.stroke ?? c.stroke;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
}

function line(x1: number, y1: number, x2: number, y2: number, c: Colors): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c.stroke}" stroke-width="2" stroke-linecap="round"/>`;
}

function textLines(x: number, y: number, w: number, rows: number, c: Colors, gap = 10): string {
  const parts: string[] = [];
  for (let i = 0; i < rows; i++) {
    const lw = i === 0 ? w : Math.max(40, w - i * 24);
    parts.push(rect(x, y + i * (8 + gap), lw, 8, c, { r: 4 }));
  }
  return parts.join("");
}

function grid(x: number, y: number, cols: number, rows: number, cw: number, ch: number, c: Colors, gap = 10): string {
  const parts: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c2 = 0; c2 < cols; c2++) {
      parts.push(rect(x + c2 * (cw + gap), y + r * (ch + gap), cw, ch, c));
    }
  }
  return parts.join("");
}

// Section/organism compositions
function heroBanner(): string {
  const c = getColors();
  const img = rect(12, 12, CANVAS.w - 24, CANVAS.h - 24, c, { r: 10 });
  const overlay = `<rect x="20" y="28" width="200" height="120" fill="${c.overlay}" stroke="${c.stroke}" stroke-width="1" rx="10"/>`;
  const lines = textLines(32, 44, 160, 4, c, 12);
  const cta = rect(32, 112, 96, 16, c, { r: 8 });
  return svg([img, overlay, lines, cta], CANVAS, c);
}

function productGrid(): string {
  const c = getColors();
  const cards = grid(20, 20, 3, 2, 100, 90, c, 12);
  return svg([cards], CANVAS, c);
}

function gallery(): string {
  const c = getColors();
  const track = rect(16, 50, CANVAS.w - 32, 120, c);
  const thumbs = grid(28, 170, 6, 1, 50, 36, c, 12);
  return svg([track, thumbs], CANVAS, c);
}

function testimonials(): string {
  const c = getColors();
  const card1 = rect(22, 36, 166, 140, c);
  const card2 = rect(212, 50, 166, 140, c);
  const l1 = textLines(36, 56, 136, 5, c, 12);
  const l2 = textLines(226, 70, 136, 5, c, 12);
  return svg([card1, card2, l1, l2], CANVAS, c);
}

function header(): string {
  const c = getColors();
  const bar = rect(10, 16, CANVAS.w - 20, 28, c, { r: 6 });
  const nav = grid(180, 20, 4, 1, 36, 20, c, 12);
  const logo = rect(20, 20, 80, 20, c, { r: 6 });
  return svg([bar, logo, nav], CANVAS, c);
}

function footer(): string {
  const c = getColors();
  const bar = rect(10, CANVAS.h - 56, CANVAS.w - 20, 40, c, { r: 6 });
  const cols = grid(20, CANVAS.h - 120, 3, 1, 110, 52, c, 20);
  return svg([cols, bar], CANVAS, c);
}

function multiColumn(): string {
  const c = getColors();
  const cols = grid(20, 28, 3, 1, 110, 160, c, 20);
  return svg([cols], CANVAS, c);
}

function stackFlex(): string {
  const c = getColors();
  const a = rect(20, 24, CANVAS.w - 40, 50, c);
  const b = rect(20, 84, CANVAS.w - 40, 50, c);
  const d = rect(20, 144, CANVAS.w - 40, 50, c);
  return svg([a, b, d], CANVAS, c);
}

function gridContainer(): string {
  const c = getColors();
  const g = grid(20, 28, 4, 2, 80, 68, c, 12);
  return svg([g], CANVAS, c);
}

function valueProps(): string {
  const c = getColors();
  const icons = grid(34, 40, 3, 1, 72, 72, c, 44);
  const lines1 = textLines(34, 120, 72, 2, c, 8);
  const lines2 = textLines(150, 120, 72, 2, c, 8);
  const lines3 = textLines(266, 120, 72, 2, c, 8);
  return svg([icons, lines1, lines2, lines3], CANVAS, c);
}

function newsletter(): string {
  const c = getColors();
  const box = rect(30, 64, CANVAS.w - 60, 100, c);
  const input = rect(48, 100, 220, 20, c, { r: 6 });
  const btn = rect(276, 100, 80, 20, c, { r: 6 });
  return svg([box, input, btn], CANVAS, c);
}

function genericSection(): string {
  const c = getColors();
  const headerBox = rect(20, 24, CANVAS.w - 40, 48, c);
  const body = rect(20, 84, CANVAS.w - 40, 112, c);
  const lines = textLines(36, 44, 240, 3, c, 12);
  return svg([headerBox, body, lines], CANVAS, c);
}

function imageSlider(): string {
  const c = getColors();
  const track = rect(16, 36, CANVAS.w - 32, 140, c);
  const left = line(28, 106, 44, 106, c) + line(28, 106, 36, 98, c) + line(28, 106, 36, 114, c);
  const right = line(CANVAS.w - 28, 106, CANVAS.w - 44, 106, c) + line(CANVAS.w - 28, 106, CANVAS.w - 36, 98, c) + line(CANVAS.w - 28, 106, CANVAS.w - 36, 114, c);
  return svg([track, left, right], CANVAS, c);
}

function productCarousel(): string {
  const c = getColors();
  const cards = grid(28, 60, 4, 1, 78, 88, c, 12);
  return svg([cards], CANVAS, c);
}

// Map of component type to a generator (covers containers + organisms/sections)
const GENERATORS: Record<string, () => string> = {
  // Containers
  Section: genericSection,
  MultiColumn: multiColumn,
  StackFlex: stackFlex,
  Grid: gridContainer,
  CarouselContainer: () => {
    const c = getColors();
    const track = rect(20, 60, CANVAS.w - 40, 100, c);
    const cards = grid(28, 70, 4, 1, 78, 80, c, 12);
    return svg([track, cards], CANVAS, c);
  },
  TabsAccordionContainer: () => {
    const c = getColors();
    const tabs = grid(24, 24, 4, 1, 80, 26, c, 12);
    const panel = rect(20, 64, CANVAS.w - 40, 130, c);
    return svg([tabs, panel], CANVAS, c);
  },
  Dataset: () => {
    const c = getColors();
    const table = grid(28, 36, 4, 3, 80, 40, c, 12);
    return svg([table], CANVAS, c);
  },
  Repeater: () => {
    const c = getColors();
    const items = grid(24, 28, 1, 3, CANVAS.w - 48, 52, c, 12);
    return svg([items], CANVAS, c);
  },
  Bind: () => {
    const c = getColors();
    const box = rect(24, 36, CANVAS.w - 48, 140, c);
    const plug = textLines(40, 60, 220, 3, c, 12);
    const arrow = line(280, 110, 360, 110, c);
    const target = rect(340, 92, 40, 36, c, { r: 6 });
    return svg([box, plug, arrow, target], CANVAS, c);
  },

  // Organisms / sections
  AnnouncementBar: () => {
    const c = getColors();
    const bar = rect(16, 24, CANVAS.w - 32, 36, c, { r: 6 });
    const txt = textLines(28, 36, CANVAS.w - 60, 2, c, 10);
    return svg([bar, txt], CANVAS, c);
  },
  HeroBanner: heroBanner,
  ValueProps: valueProps,
  ReviewsCarousel: productCarousel,
  ProductGrid: productGrid,
  ProductCarousel: productCarousel,
  RecommendationCarousel: productCarousel,
  FeaturedProduct: () => {
    const c = getColors();
    const media = rect(24, 28, 180, 140, c);
    const info = textLines(220, 36, 160, 5, c, 12);
    const btn = rect(220, 140, 120, 20, c, { r: 8 });
    return svg([media, info, btn], CANVAS, c);
  },
  ImageSlider: imageSlider,
  CollectionList: () => {
    const c = getColors();
    const rows = grid(24, 28, 1, 4, CANVAS.w - 48, 36, c, 12);
    return svg([rows], CANVAS, c);
  },
  Gallery: gallery,
  Lookbook: () => {
    const c = getColors();
    const g = grid(24, 28, 3, 2, 108, 80, c, 12);
    return svg([g], CANVAS, c);
  },
  ContactForm: () => {
    const c = getColors();
    const form = rect(24, 36, CANVAS.w - 48, 140, c);
    const fields = [
      rect(36, 48, CANVAS.w - 72, 20, c, { r: 6 }),
      rect(36, 78, CANVAS.w - 72, 20, c, { r: 6 }),
      rect(36, 108, CANVAS.w - 72, 40, c, { r: 6 }),
      rect(36, 154, 120, 20, c, { r: 8 }),
    ];
    return svg([form, ...fields], CANVAS, c);
  },
  ContactFormWithMap: () => {
    const c = getColors();
    const map = rect(24, 36, 180, 140, c);
    const pinV = line(110, 60, 110, 80, c) + line(110, 80, 120, 95, c);
    const form = rect(220, 36, 156, 140, c);
    const fields = [
      rect(232, 48, 132, 20, c, { r: 6 }),
      rect(232, 78, 132, 20, c, { r: 6 }),
      rect(232, 108, 132, 20, c, { r: 6 }),
      rect(232, 138, 80, 20, c, { r: 8 }),
    ];
    return svg([map, pinV, form, ...fields], CANVAS, c);
  },
  BlogListing: () => {
    const c = getColors();
    const cards = grid(24, 36, 2, 2, 170, 80, c, 20);
    const lines = [textLines(28, 42, 160, 2, c, 8), textLines(222, 42, 160, 2, c, 8)];
    return svg([cards, ...lines], CANVAS, c);
  },
  Testimonials: testimonials,
  TestimonialSlider: testimonials,
  MapBlock: () => {
    const c = getColors();
    const map = rect(24, 28, CANVAS.w - 48, 150, c);
    const cross = line(200, 60, 200, 146, c) + line(120, 102, 280, 102, c);
    return svg([map, cross], CANVAS, c);
  },
  StoreLocatorBlock: () => {
    const c = getColors();
    const map = rect(24, 28, 200, 150, c);
    const list = grid(236, 28, 1, 4, 140, 32, c, 10);
    return svg([map, list], CANVAS, c);
  },
  VideoBlock: () => {
    const c = getColors();
    const frame = rect(24, 28, CANVAS.w - 48, 150, c);
    const play = line(180, 86, 210, 102, c) + line(210, 102, 180, 118, c) + line(180, 86, 180, 118, c);
    return svg([frame, play], CANVAS, c);
  },
  FAQBlock: () => {
    const c = getColors();
    const qs = grid(24, 36, 1, 4, CANVAS.w - 48, 30, c, 12);
    return svg([qs], CANVAS, c);
  },
  CountdownTimer: () => {
    const c = getColors();
    const dials = grid(40, 80, 4, 1, 70, 60, c, 24);
    return svg([dials], CANVAS, c);
  },
  SocialLinks: () => {
    const c = getColors();
    const icons = grid(40, 100, 5, 1, 40, 40, c, 16);
    return svg([icons], CANVAS, c);
  },
  SocialFeed: () => {
    const c = getColors();
    const feed = grid(24, 24, 3, 2, 108, 90, c, 12);
    return svg([feed], CANVAS, c);
  },
  SocialProof: () => {
    const c = getColors();
    const badges = grid(28, 60, 4, 1, 78, 60, c, 12);
    return svg([badges], CANVAS, c);
  },
  NewsletterSignup: newsletter,
  SearchBar: () => {
    const c = getColors();
    const input = rect(28, 96, CANVAS.w - 56, 36, c, { r: 18 });
    return svg([input], CANVAS, c);
  },
  PricingTable: () => {
    const c = getColors();
    const cols = grid(28, 40, 3, 1, 110, 140, c, 16);
    return svg([cols], CANVAS, c);
  },
  Tabs: () => {
    const c = getColors();
    const tabs = grid(24, 24, 4, 1, 80, 26, c, 12);
    const panel = rect(20, 64, CANVAS.w - 40, 130, c);
    return svg([tabs, panel], CANVAS, c);
  },
  ProductComparison: () => {
    const c = getColors();
    const table = grid(24, 36, 4, 4, 80, 32, c, 10);
    return svg([table], CANVAS, c);
  },
  GiftCardBlock: () => {
    const c = getColors();
    const card = rect(60, 60, CANVAS.w - 120, 100, c, { r: 12 });
    const band = rect(80, 90, CANVAS.w - 160, 16, c, { r: 8 });
    return svg([card, band], CANVAS, c);
  },
  FormBuilderBlock: () => {
    const c = getColors();
    const form = rect(24, 36, CANVAS.w - 48, 140, c);
    const fields = grid(36, 48, 1, 4, CANVAS.w - 72, 22, c, 14);
    return svg([form, fields], CANVAS, c);
  },
  PopupModal: () => {
    const c = getColors();
    const scrim = rect(0, 0, CANVAS.w, CANVAS.h, c, { r: 0, fill: c.overlay, stroke: c.overlay });
    const modal = rect(80, 42, CANVAS.w - 160, CANVAS.h - 84, c);
    const lines = textLines(100, 62, CANVAS.w - 200, 4, c, 12);
    return svg([scrim, modal, lines], CANVAS, c);
  },
  ProductBundle: () => {
    const c = getColors();
    const items = grid(24, 36, 3, 1, 110, 120, c, 16);
    const btn = rect(140, 170, 120, 20, c, { r: 8 });
    return svg([items, btn], CANVAS, c);
  },
  ProductFilter: () => {
    const c = getColors();
    const chips = grid(24, 32, 4, 2, 80, 24, c, 12);
    const results = grid(24, 96, 3, 1, 110, 100, c, 16);
    return svg([chips, results], CANVAS, c);
  },
  // Header variants
  HeaderSection: header,
  "HeaderSection:minimal": header,
  "HeaderSection:centerLogo": () => {
    const c = getColors();
    const bar = rect(10, 16, CANVAS.w - 20, 28, c, { r: 6 });
    const logo = rect((CANVAS.w - 80) / 2, 20, 80, 20, c, { r: 6 });
    const utilL = grid(24, 20, 2, 1, 36, 20, c, 12);
    const utilR = grid(CANVAS.w - 24 - (2 * 36 + 12), 20, 2, 1, 36, 20, c, 12);
    return svg([bar, logo, utilL, utilR], CANVAS, c);
  },
  "HeaderSection:splitUtilities": () => {
    const c = getColors();
    const bar = rect(10, 16, CANVAS.w - 20, 28, c, { r: 6 });
    const nav = grid(100, 20, 3, 1, 50, 20, c, 10);
    const left = rect(20, 20, 60, 20, c, { r: 6 });
    const right = grid(CANVAS.w - 24 - (3 * 28 + 12*2), 20, 3, 1, 28, 20, c, 12);
    return svg([bar, left, nav, right], CANVAS, c);
  },
  "HeaderSection:transparent": () => {
    const c = getColors();
    const hero = rect(12, 12, CANVAS.w - 24, CANVAS.h - 24, c, { r: 10 });
    const bar = rect(10, 16, CANVAS.w - 20, 28, c, { r: 6, fill: c.overlay, stroke: c.stroke });
    const logo = rect(20, 20, 80, 20, c, { r: 6 });
    const nav = grid(180, 20, 4, 1, 36, 20, c, 12);
    return svg([hero, bar, logo, nav], CANVAS, c);
  },
  "HeaderSection:sticky": () => {
    const c = getColors();
    const content = grid(20, 60, 3, 2, 110, 60, c, 12);
    const bar = rect(10, 16, CANVAS.w - 20, 28, c, { r: 6 });
    const logo = rect(20, 20, 80, 20, c, { r: 6 });
    const nav = grid(180, 20, 4, 1, 36, 20, c, 12);
    return svg([content, bar, logo, nav], CANVAS, c);
  },
  // Footer variants
  FooterSection: footer,
  "FooterSection:simple": () => {
    const c = getColors();
    const bar = rect(10, CANVAS.h - 56, CANVAS.w - 20, 40, c, { r: 6 });
    return svg([bar], CANVAS, c);
  },
  "FooterSection:multiColumn": footer,
  "FooterSection:newsletter": () => {
    const c = getColors();
    const form = rect(40, CANVAS.h - 120, CANVAS.w - 80, 60, c);
    const bar = rect(10, CANVAS.h - 56, CANVAS.w - 20, 40, c, { r: 6 });
    return svg([form, bar], CANVAS, c);
  },
  "FooterSection:social": () => {
    const c = getColors();
    const icons = grid(40, CANVAS.h - 110, 5, 1, 40, 40, c, 16);
    const bar = rect(10, CANVAS.h - 56, CANVAS.w - 20, 40, c, { r: 6 });
    return svg([icons, bar], CANVAS, c);
  },
  "FooterSection:legalHeavy": () => {
    const c = getColors();
    const text = textLines(24, CANVAS.h - 120, CANVAS.w - 48, 4, c, 10);
    const bar = rect(10, CANVAS.h - 56, CANVAS.w - 20, 40, c, { r: 6 });
    return svg([text, bar], CANVAS, c);
  },
  CurrencySelector: () => {
    const c = getColors();
    const box = rect(140, 92, 120, 40, c, { r: 8 });
    return svg([box], CANVAS, c);
  },
  RentalAvailabilitySection: () => {
    const c = getColors();
    const cal = grid(36, 40, 7, 4, 44, 28, c, 8);
    return svg([cal], CANVAS, c);
  },
  RentalTermsSection: () => {
    const c = getColors();
    const terms = textLines(28, 40, CANVAS.w - 56, 8, c, 10);
    return svg([terms], CANVAS, c);
  },
  StructuredDataSection: () => {
    const c = getColors();
    const box = rect(24, 32, CANVAS.w - 48, 150, c);
    const code = textLines(40, 48, CANVAS.w - 80, 6, c, 12);
    return svg([box, code], CANVAS, c);
  },
  ConsentSection: () => {
    const c = getColors();
    const bar = rect(24, 140, CANVAS.w - 48, 40, c, { r: 10 });
    const toggle = rect(CANVAS.w - 120, 148, 64, 24, c, { r: 12 });
    return svg([bar, toggle], CANVAS, c);
  },
  AnalyticsPixelsSection: () => {
    const c = getColors();
    const tags = grid(28, 40, 3, 2, 100, 40, c, 10);
    return svg([tags], CANVAS, c);
  },
};

// Public: returns a data URL for a preview image for the given type.
export function getPalettePreview(type: string): string {
  // Support variant keys in the form "Type:variant"
  const gen = GENERATORS[type];
  if (gen) return gen();
  // Fallback to base type when a variant isn't explicitly mapped
  const base = type.includes(":") ? type.split(":")[0] : type;
  const baseGen = GENERATORS[base];
  if (baseGen) return baseGen();
  return genericSection();
}
