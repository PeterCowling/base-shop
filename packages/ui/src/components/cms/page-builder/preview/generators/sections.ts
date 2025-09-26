// Single-purpose: section/organism previews (hero, products, forms, etc.)

import { CANVAS } from "../../preview/types";
import { getColors } from "../../preview/color";
import { svg } from "../../preview/svg";
import { grid, rect, textLines, line } from "../../preview/shapes";

export function heroBanner(): string {
  const c = getColors();
  const img = rect(12, 12, CANVAS.w - 24, CANVAS.h - 24, c, { r: 10 });
  const overlay = `<rect x="20" y="28" width="200" height="120" fill="${c.overlay}" stroke="${c.stroke}" stroke-width="1" rx="10"/>`;
  const lines = textLines(32, 44, 160, 4, c, 12);
  const cta = rect(32, 112, 96, 16, c, { r: 8 });
  return svg([img, overlay, lines, cta], CANVAS, c);
}

export function announcementBar(): string {
  const c = getColors();
  const bar = rect(16, 24, CANVAS.w - 32, 36, c, { r: 6 });
  const txt = textLines(28, 36, CANVAS.w - 60, 2, c, 10);
  return svg([bar, txt], CANVAS, c);
}

export function productGrid(): string {
  const c = getColors();
  const cards = grid(20, 20, 3, 2, 100, 90, c, 12);
  return svg([cards], CANVAS, c);
}

export function gallery(): string {
  const c = getColors();
  const track = rect(16, 50, CANVAS.w - 32, 120, c);
  const thumbs = grid(28, 170, 6, 1, 50, 36, c, 12);
  return svg([track, thumbs], CANVAS, c);
}

export function testimonials(): string {
  const c = getColors();
  const card1 = rect(22, 36, 166, 140, c);
  const card2 = rect(212, 50, 166, 140, c);
  const l1 = textLines(36, 56, 136, 5, c, 12);
  const l2 = textLines(226, 70, 136, 5, c, 12);
  return svg([card1, card2, l1, l2], CANVAS, c);
}

export function valueProps(): string {
  const c = getColors();
  const icons = grid(34, 40, 3, 1, 72, 72, c, 44);
  const lines1 = textLines(34, 120, 72, 2, c, 8);
  const lines2 = textLines(150, 120, 72, 2, c, 8);
  const lines3 = textLines(266, 120, 72, 2, c, 8);
  return svg([icons, lines1, lines2, lines3], CANVAS, c);
}

export function newsletter(): string {
  const c = getColors();
  const box = rect(30, 64, CANVAS.w - 60, 100, c);
  const input = rect(48, 100, 220, 20, c, { r: 6 });
  const btn = rect(276, 100, 80, 20, c, { r: 6 });
  return svg([box, input, btn], CANVAS, c);
}

export function imageSlider(): string {
  const c = getColors();
  const track = rect(16, 36, CANVAS.w - 32, 140, c);
  const left = line(28, 106, 44, 106, c) + line(28, 106, 36, 98, c) + line(28, 106, 36, 114, c);
  const right = line(CANVAS.w - 28, 106, CANVAS.w - 44, 106, c) + line(CANVAS.w - 28, 106, CANVAS.w - 36, 98, c) + line(CANVAS.w - 28, 106, CANVAS.w - 36, 114, c);
  return svg([track, left, right], CANVAS, c);
}

export function productCarousel(): string {
  const c = getColors();
  const cards = grid(28, 60, 4, 1, 78, 88, c, 12);
  return svg([cards], CANVAS, c);
}

export function featuredProduct(): string {
  const c = getColors();
  const media = rect(24, 28, 180, 140, c);
  const info = textLines(220, 36, 160, 5, c, 12);
  const btn = rect(220, 140, 120, 20, c, { r: 8 });
  return svg([media, info, btn], CANVAS, c);
}

export function collectionList(): string {
  const c = getColors();
  const rows = grid(24, 28, 1, 4, CANVAS.w - 48, 36, c, 12);
  return svg([rows], CANVAS, c);
}

export function lookbook(): string {
  const c = getColors();
  const g = grid(24, 28, 3, 2, 108, 80, c, 12);
  return svg([g], CANVAS, c);
}

export function contactForm(): string {
  const c = getColors();
  const form = rect(24, 36, CANVAS.w - 48, 140, c);
  const fields = [
    rect(36, 48, CANVAS.w - 72, 20, c, { r: 6 }),
    rect(36, 78, CANVAS.w - 72, 20, c, { r: 6 }),
    rect(36, 108, CANVAS.w - 72, 40, c, { r: 6 }),
    rect(36, 154, 120, 20, c, { r: 8 }),
  ];
  return svg([form, ...fields], CANVAS, c);
}

export function contactFormWithMap(): string {
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
}

export function blogListing(): string {
  const c = getColors();
  const cards = grid(24, 36, 2, 2, 170, 80, c, 20);
  const lines = [textLines(28, 42, 160, 2, c, 8), textLines(222, 42, 160, 2, c, 8)];
  return svg([cards, ...lines], CANVAS, c);
}

export function mapBlock(): string {
  const c = getColors();
  const map = rect(24, 28, CANVAS.w - 48, 150, c);
  const cross = line(200, 60, 200, 146, c) + line(120, 102, 280, 102, c);
  return svg([map, cross], CANVAS, c);
}

export function storeLocatorBlock(): string {
  const c = getColors();
  const map = rect(24, 28, 200, 150, c);
  const list = grid(236, 28, 1, 4, 140, 32, c, 10);
  return svg([map, list], CANVAS, c);
}

export function videoBlock(): string {
  const c = getColors();
  const frame = rect(24, 28, CANVAS.w - 48, 150, c);
  const play = line(180, 86, 210, 102, c) + line(210, 102, 180, 118, c) + line(180, 86, 180, 118, c);
  return svg([frame, play], CANVAS, c);
}

export function faqBlock(): string {
  const c = getColors();
  const qs = grid(24, 36, 1, 4, CANVAS.w - 48, 30, c, 12);
  return svg([qs], CANVAS, c);
}

export function countdownTimer(): string {
  const c = getColors();
  const dials = grid(40, 80, 4, 1, 70, 60, c, 24);
  return svg([dials], CANVAS, c);
}

export function socialLinks(): string {
  const c = getColors();
  const icons = grid(40, 100, 5, 1, 40, 40, c, 16);
  return svg([icons], CANVAS, c);
}

export function socialFeed(): string {
  const c = getColors();
  const feed = grid(24, 24, 3, 2, 108, 90, c, 12);
  return svg([feed], CANVAS, c);
}

export function socialProof(): string {
  const c = getColors();
  const badges = grid(28, 60, 4, 1, 78, 60, c, 12);
  return svg([badges], CANVAS, c);
}

export function searchBar(): string {
  const c = getColors();
  const input = rect(28, 96, CANVAS.w - 56, 36, c, { r: 18 });
  return svg([input], CANVAS, c);
}

export function pricingTable(): string {
  const c = getColors();
  const cols = grid(28, 40, 3, 1, 110, 140, c, 16);
  return svg([cols], CANVAS, c);
}

export function tabs(): string {
  const c = getColors();
  const tabs = grid(24, 24, 4, 1, 80, 26, c, 12);
  const panel = rect(20, 64, CANVAS.w - 40, 130, c);
  return svg([tabs, panel], CANVAS, c);
}

export function productComparison(): string {
  const c = getColors();
  const table = grid(24, 36, 4, 4, 80, 32, c, 10);
  return svg([table], CANVAS, c);
}

export function giftCardBlock(): string {
  const c = getColors();
  const card = rect(60, 60, CANVAS.w - 120, 100, c, { r: 12 });
  const band = rect(80, 90, CANVAS.w - 160, 16, c, { r: 8 });
  return svg([card, band], CANVAS, c);
}

export function formBuilderBlock(): string {
  const c = getColors();
  const form = rect(24, 36, CANVAS.w - 48, 140, c);
  const fields = grid(36, 48, 1, 4, CANVAS.w - 72, 22, c, 14);
  return svg([form, fields], CANVAS, c);
}

export function popupModal(): string {
  const c = getColors();
  const scrim = rect(0, 0, CANVAS.w, CANVAS.h, c, { r: 0, fill: c.overlay, stroke: c.overlay });
  const modal = rect(80, 42, CANVAS.w - 160, CANVAS.h - 84, c);
  const lines = textLines(100, 62, CANVAS.w - 200, 4, c, 12);
  return svg([scrim, modal, lines], CANVAS, c);
}

export function productBundle(): string {
  const c = getColors();
  const items = grid(24, 36, 3, 1, 110, 120, c, 16);
  const btn = rect(140, 170, 120, 20, c, { r: 8 });
  return svg([items, btn], CANVAS, c);
}

export function productFilter(): string {
  const c = getColors();
  const chips = grid(24, 32, 4, 2, 80, 24, c, 12);
  const results = grid(24, 96, 3, 1, 110, 100, c, 16);
  return svg([chips, results], CANVAS, c);
}

export function currencySelector(): string {
  const c = getColors();
  const box = rect(140, 92, 120, 40, c, { r: 8 });
  return svg([box], CANVAS, c);
}

export function rentalAvailabilitySection(): string {
  const c = getColors();
  const cal = grid(36, 40, 7, 4, 44, 28, c, 8);
  return svg([cal], CANVAS, c);
}

export function rentalTermsSection(): string {
  const c = getColors();
  const terms = textLines(28, 40, CANVAS.w - 56, 8, c, 10);
  return svg([terms], CANVAS, c);
}

export function structuredDataSection(): string {
  const c = getColors();
  const box = rect(24, 32, CANVAS.w - 48, 150, c);
  const code = textLines(40, 48, CANVAS.w - 80, 6, c, 12);
  return svg([box, code], CANVAS, c);
}

export function consentSection(): string {
  const c = getColors();
  const bar = rect(24, 140, CANVAS.w - 48, 40, c, { r: 10 });
  const toggle = rect(CANVAS.w - 120, 148, 64, 24, c, { r: 12 });
  return svg([bar, toggle], CANVAS, c);
}

export function analyticsPixelsSection(): string {
  const c = getColors();
  const tags = grid(28, 40, 3, 2, 100, 40, c, 10);
  return svg([tags], CANVAS, c);
}
