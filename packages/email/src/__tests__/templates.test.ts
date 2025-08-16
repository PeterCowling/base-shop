import * as React from "react";

describe("renderTemplate", () => {
  it("renders registered string templates with variables", async () => {
    const {
      registerTemplate,
      renderTemplate,
      clearTemplates,
      setMarketingEmailTemplates,
    } = await import("../templates");
    setMarketingEmailTemplates([]);
    registerTemplate("welcome", "<p>Hello {{name}}</p>");
    const html = renderTemplate("welcome", { name: "Ada" });
    expect(html).toBe("<p>Hello Ada</p>");
    clearTemplates();
  });

  it("renders marketing email template variants", async () => {
    const { renderTemplate, setMarketingEmailTemplates } = await import(
      "../templates",
    );
    setMarketingEmailTemplates([
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
    ]);
    const html = renderTemplate("basic", {
      subject: "Hi",
      body: "<p>Test</p>",
    });
    expect(html).toContain("<h1>Hi</h1>");
    expect(html).toContain("<p>Test</p>");
    expect(html).toContain("%%UNSUBSCRIBE%%");
  });
});

