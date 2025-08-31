import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MarketingEmailTemplate,
  marketingEmailTemplates,
} from "@acme/email-templates";

describe("MarketingEmailTemplate", () => {
  it("renders headline, content, CTA and footer", () => {
    const html = renderToStaticMarkup(
      <MarketingEmailTemplate
        logoSrc="/logo.png"
        headline="Welcome"
        content={<p>Hi there</p>}
        ctaLabel="Click me"
        ctaHref="https://example.com"
        footer={<span>Bye</span>}
      />
    );

    expect(html).toContain("Welcome");
    expect(html).toContain("<p>Hi there</p>");
    expect(html).toContain("Click me");
    expect(html).toContain("Bye");
  });
});

describe("marketingEmailTemplates", () => {
  it("renders provided variants", () => {
    const props = {
      headline: "Hello",
      content: <p>Content</p>,
    };
    const basic = marketingEmailTemplates.find((t) => t.id === "basic");
    const centered = marketingEmailTemplates.find((t) => t.id === "centered");
    expect(basic).toBeDefined();
    expect(centered).toBeDefined();

    const basicHtml = renderToStaticMarkup(basic!.render(props));
    const centeredHtml = renderToStaticMarkup(centered!.render(props));

    expect(basicHtml).toContain("Hello");
    expect(centeredHtml).toContain("text-center");
  });
});
