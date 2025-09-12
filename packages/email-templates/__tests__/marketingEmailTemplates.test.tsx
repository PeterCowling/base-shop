import * as React from "react";
import {
  marketingEmailTemplates,
  MarketingEmailTemplate,
} from "@acme/email-templates";

marketingEmailTemplates.forEach((variant) => {
  describe(`${variant.id} template`, () => {
    it("returns empty fragment when headline is missing", () => {
      const result = variant.make({ content: <p /> } as any);
      expect(result.type).toBe(React.Fragment);
      expect(result.props.children).toBeUndefined();
    });

    it("returns empty fragment when content is missing", () => {
      const result = variant.make({ headline: "Hello" } as any);
      expect(result.type).toBe(React.Fragment);
      expect(result.props.children).toBeUndefined();
    });

    it("buildSubject echoes the headline", () => {
      const headline = "Subject";
      expect(variant.buildSubject(headline)).toBe(headline);
    });
  });
});

describe("basic variant", () => {
  const basic = marketingEmailTemplates.find((v) => v.id === "basic");
  const validProps = { headline: "Hello", content: <p>Body</p> };

  it("returns MarketingEmailTemplate without extra className", () => {
    expect(basic).toBeDefined();
    const element = basic!.make(validProps);
    expect(element.type).toBe(MarketingEmailTemplate);
    expect(element.props.className).toBeUndefined();
  });
});

describe("centered variant", () => {
  const centered = marketingEmailTemplates.find((v) => v.id === "centered");
  const validProps = { headline: "Hello", content: <p>Body</p> };

  it("returns MarketingEmailTemplate with text-center className", () => {
    expect(centered).toBeDefined();
    const element = centered!.make(validProps);
    expect(element.type).toBe(MarketingEmailTemplate);
    expect(element.props.className).toBe("text-center");
  });
});

