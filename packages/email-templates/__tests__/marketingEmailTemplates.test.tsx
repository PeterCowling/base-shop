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

  it("creates MarketingEmailTemplate with correct className", () => {
    marketingEmailTemplates.forEach((variant) => {
      const element = variant.make(validProps);
      expect(element.type).toBe(MarketingEmailTemplate);
      if (variant.id === "centered") {
        expect(element.props.className).toBe("text-center");
      } else {
        expect(element.props.className).toBeUndefined();
      }
    });
  });

  it("buildSubject returns headline", () => {
    marketingEmailTemplates.forEach((variant) => {
      const headline = "Subject";
      expect(variant.buildSubject(headline)).toBe(headline);
    });
  });
});

