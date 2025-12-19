import { shopConfigSchema } from "../src/shop-config";
import {
  sectionPresetSchema,
  sectionTemplateSchema,
} from "../src/section/template";
import {
  localeSchema,
  scaffoldSpecSchema,
} from "../src/page/page";
import { tabsAccordionContainerComponentSchema } from "../src/page/layouts/tabs-accordion-container";

const baseSection = {
  id: "section-1",
  type: "Section" as const,
  children: [{ id: "text-1", type: "Text" as const, text: "Hello" }],
};

describe("page component schemas", () => {
  it("parses tabs/accordion container components with children", () => {
    const parsed = tabsAccordionContainerComponentSchema.parse({
      id: "tabs-1",
      type: "TabsAccordionContainer",
      mode: "tabs",
      tabs: ["Tab 1", "Tab 2"],
      children: [
        { id: "child-text", type: "Text", text: "Nested" },
        baseSection,
      ],
    });

    expect(parsed.tabs).toEqual(["Tab 1", "Tab 2"]);
    expect(parsed.children?.map((c) => c.id)).toEqual([
      "child-text",
      "section-1",
    ]);
  });
});

describe("section templates", () => {
  it("requires the template root to be a Section", () => {
    const template = {
      id: "tmpl-1",
      label: "Hero",
      status: "draft" as const,
      template: baseSection,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      createdBy: "user-1",
    };

    expect(sectionTemplateSchema.parse(template)).toMatchObject({
      label: "Hero",
      template: expect.objectContaining({ type: "Section" }),
    });

    const invalid = {
      ...template,
      template: { id: "text-2", type: "Text" as const, text: "Not a section" },
    };
    expect(sectionTemplateSchema.safeParse(invalid).success).toBe(false);
  });

  it("parses section presets with locked keys", () => {
    const preset = {
      id: "preset-1",
      label: "Homepage hero",
      template: baseSection,
      locked: ["children"],
      tags: ["homepage"],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      createdBy: "user-1",
    };

    expect(sectionPresetSchema.parse(preset)).toMatchObject({
      locked: ["children"],
      tags: ["homepage"],
    });
  });
});

describe("shop config schema", () => {
  it("parses shop config with nested nav items and page info", () => {
    const config = {
      name: "Demo shop",
      navItems: [
        {
          label: "Home",
          url: "/",
          children: [{ label: "About", url: "/about" }],
        },
      ],
      pages: [
        {
          slug: "home",
          title: { en: "Home" },
          components: [{ id: "hero-1", type: "Section", children: [] }],
        },
      ],
      checkoutPage: [{ id: "checkout-text", type: "Text", text: "Checkout" }],
      runtimeAppId: "app-123",
    };

    const parsed = shopConfigSchema.parse(config);
    expect(parsed.navItems?.[0].children?.[0].url).toBe("/about");
    expect(parsed.pages?.[0].title.en).toBe("Home");
  });
});

describe("page module exports", () => {
  it("re-exports shared schemas", () => {
    expect(localeSchema.parse("en")).toBe("en");

    const scaffold = scaffoldSpecSchema.parse({
      layout: "sidebar",
      sections: ["hero", "footer"],
      cta: "cta-block",
    });

    expect(scaffold.sections).toEqual(["hero", "footer"]);
  });
});
