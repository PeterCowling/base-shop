import * as React from "react";
import { render } from "@testing-library/react";
import { marketingEmailTemplates } from "@acme/email-templates";

describe("marketingEmailTemplates error handling", () => {
  it("throws for invalid props and echoes headline", () => {
    marketingEmailTemplates.forEach((variant) => {
      expect(() =>
        render(variant.make({ content: <p /> } as any)),
      ).toThrow("headline and content are required");

      const headline = "Sample";
      expect(variant.buildSubject(headline)).toBe(headline);
    });
  });
});
