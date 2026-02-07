import type { SectionTemplate } from "@acme/types";

import { validateSectionRules } from "../sectionRules";

function sectionWith(nodes: any[], overrides: Partial<SectionTemplate> = {}): SectionTemplate {
  return {
    id: "s1",
    label: "L",
    status: "draft",
    template: { type: "Section", id: "root", children: nodes } as any,
    createdAt: "t",
    updatedAt: "t",
    createdBy: "me",
    ...overrides,
  } as SectionTemplate;
}

describe("validateSectionRules", () => {
  it("passes when rules satisfied", () => {
    const res = validateSectionRules([sectionWith([])]);
    expect(res).toEqual({ ok: true });
  });

  it("flags multiple hero-like sections", () => {
    const hero = { type: "HeroBanner" };
    const res = validateSectionRules([
      sectionWith([hero]),
      sectionWith([{ type: "CampaignHeroSection" }]),
    ]);
    expect(res.ok).toBe(false);
    if (res.ok === false) {
      expect(res.errors.join(" ")).toMatch(/Only one hero section/);
    }
  });

  it("warns when hero lacks an image-like field", () => {
    const res = validateSectionRules([
      sectionWith([{ type: "HeroBanner" }], { label: "Hero A" }),
    ]);
    expect(res.ok).toBe(false);
    if (res.ok === false) {
      expect(res.errors.some((e) => e.includes("Hero A"))).toBe(true);
    }
  });
});

