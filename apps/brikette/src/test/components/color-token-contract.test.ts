import fs from "fs";
import path from "path";

const APP_ROOT = path.resolve(process.cwd());
const UI_ROOT = path.resolve(APP_ROOT, "../../packages/ui/src");

const IN_SCOPE_FILES = [
  path.join(APP_ROOT, "src/routes/guides/utils/_linkTokens.tsx"),
  path.join(APP_ROOT, "src/app/[lang]/experiences/[slug]/GuideContent.tsx"),
  path.join(APP_ROOT, "src/app/[lang]/book/BookPageContent.tsx"),
  path.join(APP_ROOT, "src/app/[lang]/apartment/book/ApartmentBookContent.tsx"),
  path.join(UI_ROOT, "organisms/LandingHeroSection.tsx"),
  path.join(UI_ROOT, "organisms/ApartmentHeroSection.tsx"),
  path.join(UI_ROOT, "molecules/NotificationBanner.tsx"),
];

function read(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function extractVar(cssBlock: string, name: string): string {
  const match = cssBlock.match(new RegExp(`${name}:\\s*([^;]+);`));
  if (!match?.[1]) throw new Error(`Missing CSS variable ${name}`);
  return match[1].trim();
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Expected 6-digit hex color, got "${hex}"`);
  }
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = [r, g, b].map((value) => {
    const sRgb = value / 255;
    return sRgb <= 0.03928 ? sRgb / 12.92 : ((sRgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
}

function contrastRatio(fgHex: string, bgHex: string): number {
  const fg = relativeLuminance(hexToRgb(fgHex));
  const bg = relativeLuminance(hexToRgb(bgHex));
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Color token consolidation contract", () => {
  it("TC-06.1: in-scope files do not use forbidden primary/neutral class bypasses", () => {
    const forbidden = /\b(text-neutral-900|text-primary-[^"\s]+|decoration-primary-[^"\s]+|outline-primary-[^"\s]+)\b/;
    for (const filePath of IN_SCOPE_FILES) {
      expect(read(filePath)).not.toMatch(forbidden);
    }
  });

  it("TC-06.2: intentional photo-overlay scrims remain in hero surfaces", () => {
    const landingHero = read(path.join(UI_ROOT, "organisms/LandingHeroSection.tsx"));
    const apartmentHero = read(path.join(UI_ROOT, "organisms/ApartmentHeroSection.tsx"));

    expect(landingHero).toContain("bg-gradient-to-r");
    expect(landingHero).toContain("bg-gradient-to-t");
    expect(apartmentHero).toContain("bg-gradient-to-r");
    expect(apartmentHero).toContain("bg-gradient-to-t");
  });

  it("TC-08.1: JS theme constants stay aligned with CSS brand primary RGB values", () => {
    const css = read(path.join(APP_ROOT, "src/styles/global.css"));
    const ts = read(path.join(APP_ROOT, "src/utils/theme-constants.ts"));

    const rootBlock = css.match(/:root\s*\{[\s\S]*?\n\}/);
    const darkBlock = css.match(/\.dark\s*\{[\s\S]*?\n\}/);
    expect(rootBlock?.[0]).toBeTruthy();
    expect(darkBlock?.[0]).toBeTruthy();

    const cssLightRgb = extractVar(rootBlock![0], "--rgb-brand-primary");
    const cssDarkRgb = extractVar(darkBlock![0], "--rgb-brand-primary");

    const lightTs = ts.match(/BRAND_PRIMARY_RGB:[^\n]*=\s*\[(\d+,\s*\d+,\s*\d+)\]/)?.[1]?.replace(/,\s*/g, " ");
    const darkTs = ts.match(/BRAND_PRIMARY_DARK_RGB:[^\n]*=\s*\[(\d+,\s*\d+,\s*\d+)\]/)?.[1]?.replace(/,\s*/g, " ");

    expect(lightTs).toBe(cssLightRgb);
    expect(darkTs).toBe(cssDarkRgb);
  });

  it("TC-08.2: critical dark-mode token pairings meet WCAG AA for normal text", () => {
    const css = read(path.join(APP_ROOT, "src/styles/global.css"));
    const darkBlock = css.match(/\.dark\s*\{[\s\S]*?\n\}/)?.[0];
    expect(darkBlock).toBeTruthy();

    const darkPrimary = extractVar(darkBlock!, "--color-brand-primary");
    const darkBougainvillea = extractVar(darkBlock!, "--color-brand-bougainvillea");
    const darkBg = extractVar(darkBlock!, "--color-brand-bg");
    const darkOnPrimary = extractVar(darkBlock!, "--color-brand-on-primary");

    expect(contrastRatio(darkPrimary, darkBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkBougainvillea, darkBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkOnPrimary, darkPrimary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#ffffff", "#003580")).toBeGreaterThanOrEqual(4.5);
  });

  it("TC-08.3: Booking badge keeps explicit dark-mode text override", () => {
    const ratingsBar = read(path.join(UI_ROOT, "atoms/RatingsBar.tsx"));
    expect(ratingsBar).toContain('badgeTextClass: "text-brand-bg dark:text-brand-heading"');
  });
});
