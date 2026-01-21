import { z } from "zod";

import {
  bindPageComponentSchema,
  footerComponentSchema,
  headerComponentSchema,
  multiColumnComponentSchema,
  sectionComponentSchema,
  tabsComponentSchema,
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

  describe("default values", () => {
    it("defaults children for Section", () => {
      expect(
        sectionComponentSchema.parse({ id: "s2", type: "Section" })
      ).toEqual({ id: "s2", type: "Section", children: [] });
    });

    it("defaults children for MultiColumn", () => {
      expect(
        multiColumnComponentSchema.parse({ id: "m2", type: "MultiColumn" })
      ).toEqual({ id: "m2", type: "MultiColumn", children: [] });
    });

    it("defaults labels and children for Tabs", () => {
      expect(tabsComponentSchema.parse({ id: "t2", type: "Tabs" })).toEqual({
        id: "t2",
        type: "Tabs",
        labels: [],
        children: [],
      });
    });
  });

  describe("optional properties", () => {
    it("accepts columns and gap for MultiColumn", () => {
      expect(
        multiColumnComponentSchema.parse({
          id: "m3",
          type: "MultiColumn",
          columns: 3,
          gap: "1rem",
        })
      ).toEqual({
        id: "m3",
        type: "MultiColumn",
        columns: 3,
        gap: "1rem",
        children: [],
      });
    });

    it("accepts active index for Tabs", () => {
      expect(
        tabsComponentSchema.parse({ id: "t3", type: "Tabs", active: 1 })
      ).toEqual({
        id: "t3",
        type: "Tabs",
        active: 1,
        labels: [],
        children: [],
      });
    });
  });

  it("rejects tabs with invalid active index", () => {
    expect(
      tabsComponentSchema.safeParse({ id: "t2", type: "Tabs", active: "a" } as any).success
    ).toBe(false);
  });

  describe("child component parsing", () => {
    const childSchema = z.object({ id: z.string(), type: z.literal("Child") });
    const child = { id: "c1", type: "Child" } as const;

    it("parses Section children with the bound schema", () => {
      bindPageComponentSchema(childSchema);
      expect(
        sectionComponentSchema.parse({
          id: "s3",
          type: "Section",
          children: [child],
        })
      ).toEqual({ id: "s3", type: "Section", children: [child] });
    });

    it("parses MultiColumn children with the bound schema", () => {
      bindPageComponentSchema(childSchema);
      expect(
        multiColumnComponentSchema.parse({
          id: "m4",
          type: "MultiColumn",
          children: [child],
        })
      ).toEqual({ id: "m4", type: "MultiColumn", children: [child] });
    });

    it("parses Tabs children with the bound schema", () => {
      bindPageComponentSchema(childSchema);
      expect(
        tabsComponentSchema.parse({
          id: "t4",
          type: "Tabs",
          labels: [],
          children: [child],
        })
      ).toEqual({ id: "t4", type: "Tabs", labels: [], children: [child] });
    });
  });
});

