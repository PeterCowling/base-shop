import type { SectionTemplate } from "@acme/types";

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

import type { PageComponent } from "@acme/types";

type WithChildren = { children?: unknown };

function getChildren(node: PageComponent): PageComponent[] | undefined {
  const maybeChildren = (node as unknown as WithChildren).children;
  if (Array.isArray(maybeChildren)) return maybeChildren as PageComponent[];
  return undefined;
}

function walk(node: PageComponent, fn: (n: PageComponent) => void): void {
  if (!node || typeof node !== 'object') return;
  fn(node);
  const children = getChildren(node);
  if (children) children.forEach((c) => walk(c, fn));
}

export function validateSectionRules(sections: SectionTemplate[]): ValidationResult {
  const errors: string[] = [];
  // Rule 1: Max one hero-class section per page (HeroBanner/CampaignHeroSection)
  const heroTypes = new Set(["HeroBanner", "CampaignHeroSection"]);
  let heroCount = 0;
  for (const s of sections) {
    walk(s.template, (n) => {
      if (heroTypes.has(n.type)) heroCount += 1;
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
      const t = n.type;
      if (t === 'HeroBanner' || t === 'CampaignHeroSection') {
        const record = n as unknown as Record<string, unknown>;
        const hasImg = 'image' in record || 'src' in record || 'media' in record;
        if (!hasImg) {
          errors.push(`Hero section "${s.label}" may lack a large image; ensure ≥1440px width.`);
        }
      }
    });
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
