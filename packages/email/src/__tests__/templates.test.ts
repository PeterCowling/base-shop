import { jest } from "@jest/globals";
import * as React from "react";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("renders registered string templates with variables", async () => {
    jest.doMock(
      "@acme/ui",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true },
    );
    const { registerTemplate, renderTemplate, clearTemplates } = await import(
      "../templates"
    );
    registerTemplate("welcome", "<p>Hello {{name}}</p>");
    const html = renderTemplate("welcome", { name: "Ada" });
    expect(html).toBe("<p>Hello Ada</p>");
    clearTemplates();
  });

  it("renders marketing email template variants", async () => {
    jest.doMock(
      "@acme/ui",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "basic",
            render: ({ headline, content, footer }: any) => (
              React.createElement(
                "div",
                null,
                React.createElement("h1", null, headline),
                content,
                footer,
              )
            ),
          },
        ],
      }),
      { virtual: true },
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

