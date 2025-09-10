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
    const make = jest.fn(({ headline, content, footer }: any) =>
      React.createElement(
        "div",
        null,
        React.createElement("h1", null, headline),
        content,
        footer
      )
    );

    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "basic",
            label: "Basic",
            buildSubject: (h: string) => h,
            make,
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate } = await import("../src/templates");
    const html = renderTemplate("basic", {
      subject: "Hi",
      body: '<img src="x" onerror="alert(1)"><span style="color:red">hi</span><script>alert(1)</script>',
    });
    expect(make).toHaveBeenCalledTimes(1);
    expect(html).toContain("<h1>Hi</h1>");
    expect(html).toContain('<img src="x"');
    expect(html).toContain('<span>hi</span>');
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("style=");
    expect(html).toContain("%%UNSUBSCRIBE%%");
  });

  it("renders marketing template with custom footer", async () => {
    const make = jest.fn(({ headline, content, footer }: any) =>
      React.createElement(
        "div",
        null,
        React.createElement("h1", null, headline),
        content,
        footer
      )
    );

    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "basic",
            label: "Basic",
            buildSubject: (h: string) => h,
            make,
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate } = await import("../src/templates");
    const html = renderTemplate("basic", {
      subject: "Hi",
      body: "<p>x</p>",
      footer: "<span>Bye</span>",
    });
    expect(make).toHaveBeenCalledTimes(1);
    expect(html).toContain("<span>Bye</span>");
    expect(html).not.toContain("%%UNSUBSCRIBE%%");
  });

  it("falls back to minimal React shim when React is unavailable", async () => {
    jest.doMock(
      "react",
      () => {
        throw new Error("Cannot find module 'react'");
      },
      { virtual: true }
    );

    const make = jest.fn(({ headline, content, footer }: any) => [
      { type: "h1", props: { children: headline } },
      content,
      footer,
    ]);

    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "basic",
            label: "Basic",
            buildSubject: (h: string) => h,
            make,
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate, __reactShim } = await import("../src/templates");

    const el = __reactShim.createElement("span", null, "hi");
    expect(__reactShim.isValidElement(el)).toBe(true);
    expect(__reactShim.Children.map([1, 2], String)).toEqual(["1", "2"]);

    const html = renderTemplate("basic", {
      subject: "Hi",
      body: "<strong>ok</strong>",
    });
    expect(make).toHaveBeenCalledTimes(1);
    expect(html).toContain("<h1>Hi</h1>");
    expect(html).toContain("<strong>ok</strong>");
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
