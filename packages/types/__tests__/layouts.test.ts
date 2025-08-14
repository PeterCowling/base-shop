import { z } from "zod";
import {
  headerComponentSchema,
  footerComponentSchema,
  sectionComponentSchema,
  multiColumnComponentSchema,
  tabsComponentSchema,
  bindPageComponentSchema,
} from "../src/page/layouts";

// bind a simple schema to satisfy layout child references
bindPageComponentSchema(z.any());

describe("layouts schemas", () => {
  const cases: [any, any][] = [
    [headerComponentSchema, { id: "h1", type: "Header" }],
    [footerComponentSchema, { id: "f1", type: "Footer" }],
    [sectionComponentSchema, { id: "s1", type: "Section", children: [] }],
    [multiColumnComponentSchema, { id: "m1", type: "MultiColumn", children: [] }],
    [tabsComponentSchema, { id: "t1", type: "Tabs", labels: [], children: [] }],
  ];

  it.each(cases)("parses %p", (schema, data) => {
    expect(schema.parse(data)).toEqual(data);
  });

  it("rejects tabs with invalid active index", () => {
    expect(
      tabsComponentSchema.safeParse({ id: "t2", type: "Tabs", active: "a" } as any).success
    ).toBe(false);
  });
});

