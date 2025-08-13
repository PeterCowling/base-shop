import * as React from "react";

jest.mock(
  "@acme/ui",
  () => ({
    marketingEmailTemplates: [
      {
        id: "basic",
        render: ({ headline, content, footer }: any) =>
          React.createElement(
            "div",
            null,
            React.createElement("h1", null, headline),
            content,
            footer,
          ),
      },
    ],
  }),
  { virtual: true },
);

import { renderTemplate } from "../templates";

describe("renderTemplate", () => {
  it("appends unsubscribe placeholder when no template", () => {
    const html = renderTemplate(null, {
      subject: "Hi",
      body: "<p>Hello</p>",
    });
    expect(html).toBe("<p>Hello</p><p>%%UNSUBSCRIBE%%</p>");
  });

  it("renders known template variant", () => {
    const html = renderTemplate("basic", {
      subject: "Sale",
      body: "<p>Content</p>",
    });
    expect(html).toContain("Sale");
    expect(html).toContain("Content");
    expect(html).toContain("%%UNSUBSCRIBE%%");
  });

  it("falls back when template missing", () => {
    const html = renderTemplate("unknown", {
      subject: "Test",
      body: "<p>Body</p>",
    });
    expect(html).toBe("<p>Body</p><p>%%UNSUBSCRIBE%%</p>");
  });
});
