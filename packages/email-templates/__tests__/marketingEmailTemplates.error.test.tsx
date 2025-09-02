import * as React from "react";
import { marketingEmailTemplates } from "@acme/email-templates";

describe("marketingEmailTemplates error handling", () => {
  it("returns empty fragment for invalid props and echoes headline", () => {
    marketingEmailTemplates.forEach((variant) => {
      const result = variant.make({ content: <p /> } as any);
      expect(result.type).toBe(React.Fragment);
      expect(result.props.children).toBeUndefined();

      const headline = "Sample";
      expect(variant.buildSubject(headline)).toBe(headline);
    });
  });
});
