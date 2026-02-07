import { describe, expect,it } from "@jest/globals";

import { pageComponentSchema } from "../../../page/page";
import { bindComponentSchema } from "../bind";
import { carouselContainerComponentSchema } from "../carousel-container";
import { datasetComponentSchema } from "../dataset";
import { gridContainerComponentSchema } from "../grid-container";
import { repeaterComponentSchema } from "../repeater";
import { stackFlexComponentSchema } from "../stack-flex";
// import { tabsAccordionContainerComponentSchema } from "../tabs-accordion-container"; // optional seventh

// Helper child that forces z.lazy(() => pageComponentSchemaRef) to resolve
const sectionChild = { id: "sec-1", type: "Section", children: [] } as any;

describe("page layouts children schema lazy resolution", () => {
  // Touch the page schema to ensure bindPageComponentSchema has executed.
  it("binds page schema once", () => {
    // Parsing a minimal component ensures the union schema is live.
    const parsed = pageComponentSchema.parse({ id: "s", type: "Section", children: [] });
    expect(parsed.type).toBe("Section");
  });

  it("Bind component children resolves via page schema", () => {
    const parsed = bindComponentSchema.parse({ id: "b1", type: "Bind", children: [sectionChild] });
    expect(Array.isArray(parsed.children)).toBe(true);
    expect(parsed.children?.[0]?.type).toBe("Section");
  });

  it("CarouselContainer children resolves via page schema", () => {
    const parsed = carouselContainerComponentSchema.parse({ id: "c1", type: "CarouselContainer", children: [sectionChild] });
    expect(parsed.children?.[0]?.type).toBe("Section");
  });

  it("Dataset children resolves via page schema", () => {
    const parsed = datasetComponentSchema.parse({ id: "d1", type: "Dataset", children: [sectionChild] });
    expect(parsed.children?.[0]?.type).toBe("Section");
  });

  it("Grid container children resolves via page schema", () => {
    const parsed = gridContainerComponentSchema.parse({ id: "g1", type: "Grid", children: [sectionChild] });
    expect(parsed.children?.[0]?.type).toBe("Section");
  });

  it("Repeater children resolves via page schema", () => {
    const parsed = repeaterComponentSchema.parse({ id: "r1", type: "Repeater", children: [sectionChild] });
    expect(parsed.children?.[0]?.type).toBe("Section");
  });

  it("StackFlex children resolves via page schema", () => {
    const parsed = stackFlexComponentSchema.parse({ id: "sf1", type: "StackFlex", children: [sectionChild] });
    expect(parsed.children?.[0]?.type).toBe("Section");
  });
});

