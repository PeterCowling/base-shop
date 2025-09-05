import * as React from "react";
import { marketingEmailTemplates, MarketingEmailTemplate } from "@acme/email-templates";

describe("marketingEmailTemplates", () => {
  const validProps = {
    headline: "Hello",
    content: <p>Body</p>,
  };

  it("returns empty fragment for missing data", () => {
    marketingEmailTemplates.forEach((variant) => {
      const cases: any[] = [
        undefined,
        {},
        { headline: "Hello" },
        { content: <p /> },
        { headline: "Hello", content: null },
      ];
      cases.forEach((bad) => {
        const result = variant.make(bad);
        expect(result.type).toBe(React.Fragment);
        expect(result.props.children).toBeUndefined();
      });
    });
  });

  it("basic variant calls MarketingEmailTemplate", () => {
    const basic = marketingEmailTemplates.find((v) => v.id === "basic");
    expect(basic).toBeDefined();
    const element = basic!.make(validProps);
    expect(element.type).toBe(MarketingEmailTemplate);
    expect(element.props.className).toBeUndefined();
  });

  it("centered variant applies text-center class", () => {
    const centered = marketingEmailTemplates.find((v) => v.id === "centered");
    expect(centered).toBeDefined();
    const element = centered!.make(validProps);
    expect(element.type).toBe(MarketingEmailTemplate);
    expect(element.props.className).toBe("text-center");
  });

  it("buildSubject returns headline", () => {
    marketingEmailTemplates.forEach((variant) => {
      const headline = "Subject";
      expect(variant.buildSubject(headline)).toBe(headline);
    });
  });
});

