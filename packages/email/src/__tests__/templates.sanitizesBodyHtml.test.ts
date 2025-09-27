import { jest } from "@jest/globals";
import * as React from "react";

describe("renderTemplate", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("module");
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
});

