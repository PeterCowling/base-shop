import {
  tabsAccordionContainerComponentSchema as tabsAccordionFromBarrel,
  tabsComponentSchema as tabsFromBarrel,
} from "../layouts";
import { multiColumnComponentSchema } from "../layouts/multi-column";
import { tabsComponentSchema } from "../layouts/tabs";
import { tabsAccordionContainerComponentSchema } from "../layouts/tabs-accordion-container";
import {
  historyStateSchema,
  pageComponentSchema,
  pageSchema,
} from "../page";

const sectionChild = { id: "section-1", type: "Section", children: [] } as const;

const basePage = {
  id: "page-1",
  slug: "home",
  status: "draft" as const,
  components: [] as unknown[],
  seo: {
    title: {
      en: "Home",
    },
  },
  createdAt: "2026-02-23T00:00:00.000Z",
  updatedAt: "2026-02-23T00:00:00.000Z",
  createdBy: "agent",
};

describe("page schema composition contracts", () => {
  it("keeps barrel layout exports aligned with direct schema modules", () => {
    expect(tabsFromBarrel).toBe(tabsComponentSchema);
    expect(tabsAccordionFromBarrel).toBe(tabsAccordionContainerComponentSchema);
  });

  it("validates tabs composition and rejects invalid active type", () => {
    const parsed = tabsComponentSchema.parse({
      id: "tabs-1",
      type: "Tabs",
      labels: ["Specs", "Shipping"],
      active: 1,
      children: [sectionChild],
    });

    expect(parsed.children).toHaveLength(1);
    expect(parsed.children?.[0]?.type).toBe("Section");

    const invalid = tabsComponentSchema.safeParse({
      id: "tabs-2",
      type: "Tabs",
      active: "first",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates tabs-accordion composition and mode enum", () => {
    const parsed = tabsAccordionContainerComponentSchema.parse({
      id: "container-1",
      type: "TabsAccordionContainer",
      mode: "accordion",
      tabs: ["Overview", "Care"],
      children: [
        {
          id: "multi-1",
          type: "MultiColumn",
          columns: 2,
          children: [sectionChild],
        },
      ],
    });

    expect(parsed.children).toHaveLength(1);
    expect(parsed.children?.[0]?.type).toBe("MultiColumn");

    const invalidMode = tabsAccordionContainerComponentSchema.safeParse({
      id: "container-2",
      type: "TabsAccordionContainer",
      mode: "grid",
    });
    expect(invalidMode.success).toBe(false);
  });

  it("keeps layout schemas compatible with the page component union", () => {
    const tabsNode = tabsComponentSchema.parse({
      id: "tabs-3",
      type: "Tabs",
      children: [sectionChild],
    });

    const multiColumnNode = multiColumnComponentSchema.parse({
      id: "multi-2",
      type: "MultiColumn",
      columns: 2,
      children: [sectionChild],
    });

    const tabsAccordionNode = tabsAccordionContainerComponentSchema.parse({
      id: "container-3",
      type: "TabsAccordionContainer",
      mode: "tabs",
      children: [tabsNode, multiColumnNode],
    });

    expect(pageComponentSchema.parse(tabsNode).type).toBe("Tabs");
    expect(pageComponentSchema.parse(multiColumnNode).type).toBe("MultiColumn");
    expect(pageComponentSchema.parse(tabsAccordionNode).type).toBe(
      "TabsAccordionContainer"
    );
  });

  it("applies history defaults and enforces grid column bounds", () => {
    const parsedHistory = historyStateSchema.parse({
      present: [{ id: "tabs-4", type: "Tabs", children: [sectionChild] }],
    });

    expect(parsedHistory.gridCols).toBe(12);
    expect(parsedHistory.past).toEqual([]);
    expect(parsedHistory.future).toEqual([]);

    const invalidGridCols = historyStateSchema.safeParse({
      present: [],
      gridCols: 25,
    });
    expect(invalidGridCols.success).toBe(false);
  });

  it("validates page schema with composed components and strict top-level shape", () => {
    const parsedPage = pageSchema.parse({
      ...basePage,
      components: [
        {
          id: "container-4",
          type: "TabsAccordionContainer",
          mode: "tabs",
          children: [
            {
              id: "tabs-5",
              type: "Tabs",
              labels: ["One"],
              children: [sectionChild],
            },
          ],
        },
      ],
      lastPublishedComponents: [
        {
          id: "multi-3",
          type: "MultiColumn",
          columns: 2,
          children: [sectionChild],
        },
      ],
      history: {
        present: [{ id: "tabs-6", type: "Tabs", children: [sectionChild] }],
      },
    });

    expect(parsedPage.components[0]?.type).toBe("TabsAccordionContainer");
    expect(parsedPage.lastPublishedComponents?.[0]?.type).toBe("MultiColumn");
    expect(parsedPage.history?.gridCols).toBe(12);

    const invalidPage = pageSchema.safeParse({
      ...basePage,
      components: [],
      unknownKey: true,
    });
    expect(invalidPage.success).toBe(false);
  });
});
