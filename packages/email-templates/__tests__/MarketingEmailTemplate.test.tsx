import * as React from "react";
import { render } from "@testing-library/react";
import { MarketingEmailTemplate } from "@acme/email-templates";

describe("MarketingEmailTemplate", () => {
  it("renders full template", () => {
    const { container, getByText, getByAltText } = render(
      <MarketingEmailTemplate
        logoSrc="/logo.png"
        shopName="Acme"
        headline="Welcome"
        content={<p>Hi there</p>}
        ctaLabel="Click me"
        ctaHref="https://example.com"
        footer={<span>Bye</span>}
      />
    );

    expect(getByText("Welcome")).toBeInTheDocument();
    expect(getByText("Hi there")).toBeInTheDocument();
    expect(getByAltText("Acme")).toBeInTheDocument();
    expect(getByText("Click me").closest("a")).toHaveAttribute(
      "href",
      "https://example.com"
    );
    expect(container.querySelector(".border-t")).not.toBeNull();
    expect(getByText("Bye")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass(
      "mx-auto w-full max-w-xl overflow-hidden rounded-md border text-sm"
    );
  });

  it("renders logo and footer but omits CTA when CTA props are missing", () => {
    const { getByAltText, getByText, queryByRole } = render(
      <MarketingEmailTemplate
        headline="Headline"
        content={<p>Body</p>}
        logoSrc="/logo.png"
        shopName="Acme"
        footer={<span>Bye</span>}
      />
    );

    expect(getByAltText("Acme")).toBeInTheDocument();
    expect(getByText("Bye")).toBeInTheDocument();
    expect(queryByRole("link")).toBeNull();
  });

  it("renders i18n variations", () => {
    const { getByText } = render(
      <MarketingEmailTemplate
        headline="Bienvenido"
        content={<p>Hola</p>}
        ctaLabel="Haga clic"
        ctaHref="https://ejemplo.com"
        shopName="Acme"
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
        shopName="Acme"
      />
    );

    expect(container.firstChild).toHaveClass(
      "mx-auto w-full max-w-xl overflow-hidden rounded-md border text-sm custom"
    );
  });

  it("omits logo and footer containers when data is missing", () => {
    const { container, queryByAltText } = render(
      <MarketingEmailTemplate headline="No Extras" content={<p>content</p>} shopName="Acme" />
    );

    expect(queryByAltText("Acme")).toBeNull();
    expect(container.querySelector(".border-t")).toBeNull();
  });

  it("does not render header when shopName is missing", () => {
    const { container } = render(
      <MarketingEmailTemplate
        headline="No Shop"
        content={<p>content</p>}
        logoSrc="/logo.png"
      />
    );

    expect(container.querySelector(".bg-muted.p-6.text-center")).toBeNull();
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

