import {
  buttonComponentSchema,
  customHtmlComponentSchema,
  imageComponentSchema,
  textComponentSchema,
} from "../src/page/atoms";

describe("atoms schemas", () => {
  const cases: [string, any, any][] = [
    ["Image", imageComponentSchema, { id: "1", type: "Image", src: "a.jpg" }],
    ["Text", textComponentSchema, { id: "2", type: "Text", text: "hi" }],
    ["CustomHtml", customHtmlComponentSchema, { id: "3", type: "CustomHtml", html: "<b>hi</b>" }],
    ["Button", buttonComponentSchema, { id: "4", type: "Button", label: "Go" }],
  ];

  it.each(cases)("parses %s", (_name, schema, data) => {
    expect(schema.parse(data)).toEqual(data);
  });

  it("rejects invalid button variant", () => {
    expect(
      buttonComponentSchema.safeParse({ id: "b", type: "Button", variant: "big" } as any)
        .success
    ).toBe(false);
  });
});

