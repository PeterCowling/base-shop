import { jest } from "@jest/globals";
import * as React from "react";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
  });

  it("renders marketing email template variants", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "basic",
            label: "Basic",
            buildSubject: (h: string) => h,
            make: ({ headline, content, footer }: any) =>
              React.createElement(
                "div",
                null,
                React.createElement("h1", null, headline),
                content,
                footer
              ),
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate } = await import("../templates");
    const html = renderTemplate("basic", {
      subject: "Hi",
      body: "<p>Test</p>",
    });
    expect(html).toContain("<h1>Hi</h1>");
    expect(html).toContain("<p>Test</p>");
    expect(html).toContain("%%UNSUBSCRIBE%%");
  });
});

