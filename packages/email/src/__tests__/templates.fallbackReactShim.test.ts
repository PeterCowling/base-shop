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
    // Load shim after mocks; then keep it const (never reassigned further)
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
    const ReactShim = __reactShim as typeof React;
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
});
