import { jest } from "@jest/globals";
import * as React from "react";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
  });

  it("falls back to a React shim when node require fails", async () => {
    jest.doMock("module", () => ({
      createRequire: () => () => {
        throw new Error("mock fail");
      },
    }));
    let ReactShim: any;
    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "complex",
            label: "Complex",
            buildSubject: (h: string) => h,
            make: ({ headline, content, footer }: any) =>
              ReactShim.createElement(
                "div",
                { className: "outer" },
                ReactShim.createElement("h1", null, headline),
                ReactShim.Children.map([content, footer], (child, i) =>
                  ReactShim.createElement(
                    "section",
                    { "data-idx": i },
                    child,
                    ReactShim.createElement("span", null, "!")
                  )
                )
              ),
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate, __reactShim } = await import("../templates");
    ReactShim = __reactShim;
    const ceSpy = jest.spyOn(__reactShim, "createElement");
    const iveSpy = jest.spyOn(__reactShim, "isValidElement");
    const mapSpy = jest.spyOn(__reactShim.Children, "map");

    const html = renderTemplate("complex", {
      subject: "Hi",
      body: "<p>Test</p>",
    });
    expect(html).toBe(
      '<div className="outer"><h1>Hi</h1><section data-idx="0"><div><p>Test</p></div><span>!</span></section><section data-idx="1"><p>%%UNSUBSCRIBE%%</p><span>!</span></section></div>'
    );
    expect(ceSpy).toHaveBeenCalled();
    expect(iveSpy).toHaveBeenCalled();
    expect(mapSpy).toHaveBeenCalled();
    expect(__reactShim.Children.map(undefined as any, () => "")).toEqual([]);
    expect(__reactShim.Children.map(false as any, () => "")).toEqual([]);
  });

  it("registers and clears custom templates", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );
    const { registerTemplate, renderTemplate, clearTemplates } = await import(
      "../templates"
    );
    registerTemplate("welcome", "<p>Hi</p>");
    expect(renderTemplate("welcome", {})).toBe("<p>Hi</p>");
    clearTemplates();
    expect(() => renderTemplate("welcome", {})).toThrow(
      "Unknown template: welcome"
    );
  });

  it("inserts empty string for missing variables", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );
    const { registerTemplate, renderTemplate, clearTemplates } = await import(
      "../templates"
    );
    registerTemplate("greet", "<p>{{name}}</p>");
    expect(renderTemplate("greet", {})).toBe("<p></p>");
    clearTemplates();
  });

  it("escapes variables in source templates", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );
    const { registerTemplate, renderTemplate, clearTemplates } = await import(
      "../templates"
    );
    registerTemplate("greet", "<p>{{name}}</p>");
    expect(
      renderTemplate("greet", { name: "<script>alert(1)</script>" })
    ).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
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
            make: ({ content }: any) =>
              React.createElement("div", null, content),
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate } = await import("../templates");
    const html = renderTemplate("basic", {
      body: '<p style="color:red" onclick="alert(1)">Hi</p><script>alert(1)</script>',
    });
    expect(html).toBe('<div><div><p>Hi</p></div></div>');
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

  it("handles various node types", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({
        __esModule: true,
        marketingEmailTemplates: [
          {
            id: "null",
            label: "Null",
            buildSubject: (h: string) => h,
            make: () => null,
          },
          {
            id: "bool",
            label: "Bool",
            buildSubject: (h: string) => h,
            make: () => true,
          },
          {
            id: "num",
            label: "Num",
            buildSubject: (h: string) => h,
            make: () => 123,
          },
          {
            id: "array",
            label: "Array",
            buildSubject: (h: string) => h,
            make: () => [
              React.createElement("p", null, "A"),
              [React.createElement("p", null, "B")],
            ],
          },
          {
            id: "invalid",
            label: "Invalid",
            buildSubject: (h: string) => h,
            make: () => ({}) as any,
          },
          {
            id: "attrs",
            label: "Attrs",
            buildSubject: (h: string) => h,
            make: () =>
              React.createElement("div", { id: "x", className: "y" }, "Hi"),
          },
        ],
      }),
      { virtual: true }
    );

    const { renderTemplate } = await import("../templates");
    expect(renderTemplate("null", {})).toBe("");
    expect(renderTemplate("bool", {})).toBe("");
    expect(renderTemplate("num", {})).toBe("123");
    expect(renderTemplate("array", {})).toBe("<p>A</p><p>B</p>");
    expect(renderTemplate("invalid", {})).toBe("");
    expect(renderTemplate("attrs", {})).toBe(
      '<div id="x" className="y">Hi</div>'
    );
  });

  it("throws for unknown templates", async () => {
    jest.doMock(
      "@acme/email-templates",
      () => ({ __esModule: true, marketingEmailTemplates: [] }),
      { virtual: true }
    );

    const { renderTemplate } = await import("../templates");
    expect(() => renderTemplate("nonexistent", {})).toThrow(
      "Unknown template: nonexistent"
    );
  });
});
