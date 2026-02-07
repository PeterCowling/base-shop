import * as React from "react";
import { jest } from "@jest/globals";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
  });

  it("handles elements with false children", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "falsechild",
            label: "FalseChild",
            buildSubject: (h: string) => h,
            make: () => React.createElement("div", null, [false]),
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate } = await import("../templates");
    expect(renderTemplate("falsechild", {})).toBe("<div></div>");
  });
});

