import type { SectionTemplate } from "@acme/types";

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

function walk(node: any, fn: (n: any) => void) {
  if (!node || typeof node !== 'object') return;
  fn(node);
  const children = (node as any).children as any[] | undefined;
  if (Array.isArray(children)) children.forEach((c) => walk(c, fn));
}

export function validateSectionRules(sections: SectionTemplate[]): ValidationResult {
  const errors: string[] = [];
  // Rule 1: Max one hero-class section per page (HeroBanner/CampaignHeroSection)
  const heroTypes = new Set(["HeroBanner", "CampaignHeroSection"]);
  let heroCount = 0;
  for (const s of sections) {
    walk(s.template, (n) => {
      if (n && typeof n === 'object' && heroTypes.has((n as any).type)) heroCount += 1;
    });
  }
  if (heroCount > 1) {
    errors.push(`Only one hero section is allowed per page (found ${heroCount}).`);
  }

  // Rule 2: Minimum image width for hero-like sections (≥1440px)
  // Note: Without runtime image metadata, we can only enforce presence of an image field.
  // Emit a warning-style error when a hero exists but no explicit large asset field is present.
  for (const s of sections) {
    walk(s.template, (n) => {
      if (!n || typeof n !== 'object') return;
      const t = (n as any).type;
      if (t === 'HeroBanner' || t === 'CampaignHeroSection') {
        const img = (n as any).image || (n as any).src || (n as any).media;
        if (!img) {
          errors.push(`Hero section "${s.label}" may lack a large image; ensure ≥1440px width.`);
        }
      }
    });
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

