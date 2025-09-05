import { jest } from "@jest/globals";
import * as React from "react";

describe("templates registry", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("registers templates and clears them", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );
    const { registerTemplate, renderTemplate, clearTemplates } = await import(
      "../src/templates"
    );
    registerTemplate("welcome", "<p>Hi</p>");
    expect(renderTemplate("welcome", {})).toBe("<p>Hi</p>");
    clearTemplates();
    expect(() => renderTemplate("welcome", {})).toThrow(
      "Unknown template: welcome"
    );
  });

  it("replaces placeholders and inserts empty string for missing variables", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );
    const { registerTemplate, renderTemplate, clearTemplates } = await import(
      "../src/templates"
    );
    registerTemplate("greet", "<p>{{name}}</p>");
    expect(renderTemplate("greet", { name: "Alice" })).toBe("<p>Alice</p>");
    expect(renderTemplate("greet", {})).toBe("<p></p>");
    clearTemplates();
  });

  it("renders marketing template with sanitized HTML and default footer", async () => {
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

    const { renderTemplate } = await import("../src/templates");
    const html = renderTemplate("basic", {
      subject: "Hi",
      body: '<img src="x" onerror="alert(1)"><script>alert(1)</script>',
    });
    expect(html).toContain("<h1>Hi</h1>");
    expect(html).toContain('<img src="x"');
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<script>");
    expect(html).toContain("%%UNSUBSCRIBE%%");
  });

  it("throws for unknown template id", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );
    const { renderTemplate } = await import("../src/templates");
    expect(() => renderTemplate("missing", {})).toThrow(
      "Unknown template: missing"
    );
  });
});
