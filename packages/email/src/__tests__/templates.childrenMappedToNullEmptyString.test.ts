import * as React from "react";
import { jest } from "@jest/globals";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
  });

  it("renders empty string for children mapped to null", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "mapnull",
            label: "MapNull",
            buildSubject: (h: string) => h,
            make: () =>
              React.createElement(
                "div",
                null,
                React.Children.map([false], () => null)
              ),
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate } = await import("../templates");
    expect(renderTemplate("mapnull", {})).toBe("<div></div>");
  });
});

