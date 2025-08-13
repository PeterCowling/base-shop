import * as React from "react";

jest.mock(
  "@acme/ui",
  () => ({
    __esModule: true,
    marketingEmailTemplates: [
      {
        id: "basic",
        name: "Basic",
        render: ({ headline, content }: any) =>
          React.createElement(
            "div",
            null,
            React.createElement("h1", null, headline),
            content
          ),
      },
    ],
  }),
  { virtual: true }
);

describe("renderTemplate", () => {
  it("returns original body when template not found", async () => {
    const { renderTemplate } = await import("../templates");
    const html = renderTemplate("missing", {
      subject: "Hello",
      body: "<p>Hi</p>",
    });
    expect(html).toBe("<p>Hi</p>");
  });

  it("renders template when found", async () => {
    const { renderTemplate } = await import("../templates");
    const html = renderTemplate("basic", {
      subject: "Welcome",
      body: "<p>Body</p>",
    });
    expect(html).toContain("<h1>Welcome</h1>");
    expect(html).toContain("<p>Body</p>");
  });
});
