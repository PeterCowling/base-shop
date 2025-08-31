import { jest } from "@jest/globals";
import * as React from "react";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
  });

  it("renders registered string templates with variables", async () => {
    jest.doMock(
      "@acme/email-templates",
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
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "basic",
            label: "Basic",
            buildSubject: (h: string) => h,
            make: ({ headline, content, footer }: any) => (
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

  it("sanitizes body HTML", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "basic",
            label: "Basic",
            buildSubject: (h: string) => h,
            make: ({ content }: any) => React.createElement("div", null, content),
          },
        ],
      }),
      { virtual: true },
    );

    const { renderTemplate } = await import("../templates");
    const html = renderTemplate("basic", {
      body: '<img src="x" onerror="alert(1)"><script>alert(1)</script>',
    });
    expect(html).toContain('<img src="x"');
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<script>");
  });

  it("handles various node types", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          { id: "null", label: "Null", buildSubject: (h: string) => h, make: () => null },
          {
            id: "array",
            label: "Array",
            buildSubject: (h: string) => h,
            make: () => [
              React.createElement("p", null, "A"),
              React.createElement("p", null, "B"),
            ],
          },
          { id: "invalid", label: "Invalid", buildSubject: (h: string) => h, make: () => ({}) as any },
          {
            id: "attrs",
            label: "Attrs",
            buildSubject: (h: string) => h,
            make: () =>
              React.createElement("div", { id: "x", className: "y" }, "Hi"),
          },
        ],
      }),
      { virtual: true },
    );

    const { renderTemplate } = await import("../templates");
    expect(renderTemplate("null", {})).toBe("");
    expect(renderTemplate("array", {})).toBe("<p>A</p><p>B</p>");
    expect(renderTemplate("invalid", {})).toBe("");
    expect(renderTemplate("attrs", {})).toBe(
      '<div id="x" className="y">Hi</div>',
    );
  });

  it("throws for unknown templates", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true },
    );

    const { renderTemplate } = await import("../templates");
    expect(() => renderTemplate("nonexistent", {})).toThrow(
      "Unknown template",
    );
  });
});

