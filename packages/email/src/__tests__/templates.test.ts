import { renderTemplate } from "../templates";

jest.mock(
  "@acme/ui",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      marketingEmailTemplates: [
        {
          id: "basic",
          name: "Basic",
          render: ({ headline, content }: any) =>
            React.createElement("div", null, [
              React.createElement("h1", { key: "h" }, headline),
              React.createElement("div", { key: "c" }, content),
            ]),
        },
      ],
    };
  },
  { virtual: true }
);

describe("renderTemplate", () => {
  it("renders known template", () => {
    const html = renderTemplate("basic", { subject: "Hi", body: "<p>Body</p>" });
    expect(html).toContain("<!--template:basic-->");
    expect(html).toContain("<h1>Hi</h1>");
    expect(html).toContain("<p>Body</p>");
  });

  it("returns body when template missing", () => {
    const html = renderTemplate("missing", { subject: "Hi", body: "<p>Body</p>" });
    expect(html).toBe("<p>Body</p>");
  });
});
