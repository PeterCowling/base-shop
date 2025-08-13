import { renderTemplate } from "../templates";
import * as React from "react";

jest.mock(
  "@acme/ui",
  () => ({
    __esModule: true,
    marketingEmailTemplates: [
      {
        id: "mock",
        name: "Mock",
        render: ({ headline, content, footer }: any) => (
          <div>
            <h1>{headline}</h1>
            {content}
            {footer}
          </div>
        ),
      },
    ],
  }),
  { virtual: true },
);

describe("renderTemplate", () => {
  it("renders selected template variant", () => {
    const html = renderTemplate("mock", {
      subject: "Hello",
      body: "<p>World</p>",
    });
    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain("<p>World</p>");
    expect(html).toContain("%%UNSUBSCRIBE%%");
  });

  it("falls back to default markup when template missing", () => {
    const html = renderTemplate("unknown", {
      subject: "Hi",
      body: "<p>Body</p>",
    });
    expect(html).toBe("<p>Body</p><p>%%UNSUBSCRIBE%%</p>");
  });
});
