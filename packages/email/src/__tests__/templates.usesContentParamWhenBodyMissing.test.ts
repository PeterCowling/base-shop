import * as React from "react";
import { jest } from "@jest/globals";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
  });

  it("uses content param when body missing", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "basic",
            label: "Basic",
            buildSubject: (h: string) => h,
            make: ({ content }: any) =>
              React.createElement("div", null, content),
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate } = await import("../templates");
    const html = renderTemplate("basic", { content: "<p>Alt</p>" });
    expect(html).toBe("<div><div><p>Alt</p></div></div>");
  });
});

