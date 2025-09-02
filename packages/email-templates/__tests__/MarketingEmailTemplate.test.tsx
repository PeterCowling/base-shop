import * as React from "react";
import { render } from "@testing-library/react";
import { MarketingEmailTemplate } from "@acme/email-templates";

describe("MarketingEmailTemplate", () => {
  it("renders full template", () => {
    const { container, getByText } = render(
      <MarketingEmailTemplate
        logoSrc="/logo.png"
        headline="Welcome"
        content={<p>Hi there</p>}
        ctaLabel="Click me"
        ctaHref="https://example.com"
        footer={<span>Bye</span>}
      />
    );

    expect(getByText("Welcome")).toBeInTheDocument();
    expect(getByText("Hi there")).toBeInTheDocument();
    expect(getByText("Click me").closest("a")).toHaveAttribute(
      "href",
      "https://example.com"
    );
    expect(getByText("Bye")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass(
      "mx-auto w-full max-w-xl overflow-hidden rounded-md border text-sm"
    );
  });

  it("renders i18n variations", () => {
    const { getByText } = render(
      <MarketingEmailTemplate
        headline="Bienvenido"
        content={<p>Hola</p>}
        ctaLabel="Haga clic"
        ctaHref="https://ejemplo.com"
      />
    );

    expect(getByText("Bienvenido")).toBeInTheDocument();
    expect(getByText("Hola")).toBeInTheDocument();
    expect(getByText("Haga clic")).toBeInTheDocument();
  });

  it("throws when required data is missing", () => {
    expect(() => render(<MarketingEmailTemplate {...(null as any)} />)).toThrow();
  });
});

