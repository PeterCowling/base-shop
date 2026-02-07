import * as React from "react";
import { jest } from "@jest/globals";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
  });

  it("handles various node types", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "null",
            label: "Null",
            buildSubject: (h: string) => h,
            make: () => null,
          },
          {
            id: "bool",
            label: "Bool",
            buildSubject: (h: string) => h,
            make: () => true,
          },
          {
            id: "num",
            label: "Num",
            buildSubject: (h: string) => h,
            make: () => 123,
          },
          {
            id: "array",
            label: "Array",
            buildSubject: (h: string) => h,
            make: () => [
              React.createElement("p", null, "A"),
              [React.createElement("p", null, "B")],
            ],
          },
          {
            id: "invalid",
            label: "Invalid",
            buildSubject: (h: string) => h,
            make: () => ({}) as any,
          },
          {
            id: "attrs",
            label: "Attrs",
            buildSubject: (h: string) => h,
            make: () =>
              React.createElement("div", { id: "x", className: "y" }, "Hi"),
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate } = await import("../templates");
    expect(renderTemplate("null", {})).toBe("");
    expect(renderTemplate("bool", {})).toBe("");
    expect(renderTemplate("num", {})).toBe("123");
    expect(renderTemplate("array", {})).toBe("<p>A</p><p>B</p>");
    expect(renderTemplate("invalid", {})).toBe("");
    expect(renderTemplate("attrs", {})).toBe(
      '<div id="x" className="y">Hi</div>'
    );
  });
});

