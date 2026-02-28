import { render, screen } from "@testing-library/react";

import ShippingReturnsTrustBlock from "./ShippingReturnsTrustBlock";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const DEFAULT_PROPS = {
  shippingSummary: "Dispatch policy: Delivery estimated at checkout",
  returnsSummary: "Returns policy: 30-day free exchange on any order",
  lang: "en",
};

describe("ShippingReturnsTrustBlock", () => {
  // TC-04-01 / TC-02-01: trust summary text always visible
  it("renders the trust summary text in the summary element", () => {
    render(<ShippingReturnsTrustBlock {...DEFAULT_PROPS} />);

    expect(
      screen.getByText("Free exchange within 30 days · Delivery estimated at checkout"),
    ).toBeInTheDocument();
  });

  // TC-02-04: native details/summary accordion structure
  it("renders a details element with a summary child", () => {
    const { container } = render(<ShippingReturnsTrustBlock {...DEFAULT_PROPS} />);

    const details = container.querySelector("details");
    expect(details).toBeInTheDocument();
    expect(details?.querySelector("summary")).toBeInTheDocument();
  });

  // TC-02-02: shipping and returns summaries rendered when provided
  it("renders shippingSummary and returnsSummary prop text", () => {
    render(<ShippingReturnsTrustBlock {...DEFAULT_PROPS} />);

    expect(
      screen.getByText("Dispatch policy: Delivery estimated at checkout"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Returns policy: 30-day free exchange on any order"),
    ).toBeInTheDocument();
  });

  it("does not render summary paragraphs when empty strings are provided", () => {
    render(
      <ShippingReturnsTrustBlock
        shippingSummary=""
        returnsSummary=""
        lang="en"
      />,
    );

    expect(
      screen.queryByText("Dispatch policy: Delivery estimated at checkout"),
    ).not.toBeInTheDocument();
  });

  // TC-04-02 / TC-02-03: lang="en" → correct link hrefs
  it("renders shipping and returns links with lang=en prefix", () => {
    render(<ShippingReturnsTrustBlock {...DEFAULT_PROPS} lang="en" />);

    const shippingLink = screen.getByRole("link", { name: /Shipping policy/i });
    expect(shippingLink).toHaveAttribute("href", "/en/shipping");

    const returnsLink = screen.getByRole("link", { name: /Returns/i });
    expect(returnsLink).toHaveAttribute("href", "/en/returns");
  });

  // TC-04-03: lang="de" → correct link hrefs
  it("renders shipping and returns links with lang=de prefix", () => {
    render(<ShippingReturnsTrustBlock {...DEFAULT_PROPS} lang="de" />);

    const shippingLink = screen.getByRole("link", { name: /Shipping policy/i });
    expect(shippingLink).toHaveAttribute("href", "/de/shipping");

    const returnsLink = screen.getByRole("link", { name: /Returns/i });
    expect(returnsLink).toHaveAttribute("href", "/de/returns");
  });
});
