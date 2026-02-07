import * as React from "react";
import { jest } from "@jest/globals";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
  });

  it("renders elements using dangerouslySetInnerHTML", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "dsi",
            label: "DSI",
            buildSubject: (h: string) => h,
            make: () =>
              React.createElement("div", {
                dangerouslySetInnerHTML: { __html: "<p>Hi</p>" },
              }),
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate } = await import("../templates");
    expect(renderTemplate("dsi", {})).toBe("<div><p>Hi</p></div>");
  });
});

