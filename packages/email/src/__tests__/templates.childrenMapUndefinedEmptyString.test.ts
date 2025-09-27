import { jest } from "@jest/globals";
import * as React from "react";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
  });

  it("renders empty string when Children.map returns undefined", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "mapundef",
            label: "MapUndef",
            buildSubject: (h: string) => h,
            make: () =>
              React.createElement(
                "div",
                null,
                React.createElement("span", null, "Hi")
              ),
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate, __reactShim } = await import("../templates");
    const original = __reactShim.Children.map;
    __reactShim.Children.map = jest.fn(() => undefined as any);

    try {
      expect(renderTemplate("mapundef", {})).toBe("<div></div>");
    } finally {
      __reactShim.Children.map = original;
    }
  });
});

