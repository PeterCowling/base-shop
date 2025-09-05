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

  it("omits CTA section when no CTA props provided", () => {
    const { container, queryByRole } = render(
      <MarketingEmailTemplate headline="Headline" content={<p>Body</p>} />,
    );

    expect(queryByRole("link")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
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

  it("appends custom className", () => {
    const { container } = render(
      <MarketingEmailTemplate
        headline="Class Test"
        content={<p>content</p>}
        className="custom"
      />
    );

    expect(container.firstChild).toHaveClass(
      "mx-auto w-full max-w-xl overflow-hidden rounded-md border text-sm custom"
    );
  });

  it("omits logo and footer containers when data is missing", () => {
    const { container, queryByAltText } = render(
      <MarketingEmailTemplate headline="No Extras" content={<p>content</p>} />
    );

    expect(queryByAltText("logo")).toBeNull();
    expect(container.querySelector(".border-t")).toBeNull();
  });
  it("throws when headline is missing or empty", () => {
    expect(() => render(<MarketingEmailTemplate content={<p />} />)).toThrow(
      "headline and content are required",
    );
    expect(() =>
      render(<MarketingEmailTemplate headline="" content={<p />} />),
    ).toThrow("headline and content are required");
  });

  it("throws when content is null", () => {
    expect(() =>
      render(<MarketingEmailTemplate headline="X" content={null} />),
    ).toThrow("headline and content are required");
  });

  it("throws when CTA props are incomplete", () => {
    expect(() =>
      render(
        <MarketingEmailTemplate
          headline="X"
          content={<p />}
          ctaLabel="Only label"
        />,
      ),
    ).toThrow("ctaLabel and ctaHref must both be provided");

    expect(() =>
      render(
        <MarketingEmailTemplate
          headline="X"
          content={<p />}
          ctaHref="/only-href"
        />,
      ),
    ).toThrow("ctaLabel and ctaHref must both be provided");
  });
});

