import * as React from "react";
import { render } from "@testing-library/react";
import { marketingEmailTemplates } from "@acme/email-templates";

describe("marketingEmailTemplates", () => {
  const props = {
    headline: "Hello",
    content: <p>Content</p>,
  };

  it("renders provided variants", () => {
    const basic = marketingEmailTemplates.find((t) => t.id === "basic")!;
    const centered = marketingEmailTemplates.find((t) => t.id === "centered")!;

    const basicResult = render(basic.make(props));
    expect(basicResult.getByText("Hello")).toBeInTheDocument();
    expect(basicResult.container.firstChild).not.toHaveClass("text-center");

    const centeredResult = render(centered.make(props));
    expect(centeredResult.container.firstChild).toHaveClass("text-center");
  });

  it("builds subject for centered variant", () => {
    const centered = marketingEmailTemplates.find((t) => t.id === "centered")!;
    expect(centered.buildSubject("Hello")).toBe("Hello");
  });

  it("builds subjects for i18n headlines", () => {
    const variant = marketingEmailTemplates[0];
    expect(variant.buildSubject("Bienvenido")).toBe("Bienvenido");
  });

  it("handles missing data gracefully", () => {
    const variant = marketingEmailTemplates[0];
    expect(() => variant.make(null as any)).not.toThrow();
  });

  it("errors on unsupported template id", () => {
    expect(() => {
      const unsupported = marketingEmailTemplates.find((t) => t.id === "unknown");
      unsupported!.make(props);
    }).toThrow();
  });
});

