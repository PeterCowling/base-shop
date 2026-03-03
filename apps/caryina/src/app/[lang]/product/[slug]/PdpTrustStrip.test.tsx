import { render, screen } from "@testing-library/react";

import { getTrustStripContent } from "@/lib/contentPacket";

import { PdpTrustStrip } from "./PdpTrustStrip";

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

jest.mock("@/lib/contentPacket", () => ({
  getTrustStripContent: jest.fn(),
}));

const mockGetTrustStripContent = getTrustStripContent as jest.MockedFunction<typeof getTrustStripContent>;

const MOCK_TRUST_STRIP = {
  delivery: "Usually ships in 2-5 business days (EU)",
  exchange: "30-day exchange",
  origin: "Designed in Positano, Italy",
  securePayment: "Secure checkout",
};

describe("PdpTrustStrip", () => {
  beforeEach(() => {
    mockGetTrustStripContent.mockReturnValue(MOCK_TRUST_STRIP);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the trust strip wrapper with data-cy attribute", () => {
    render(<PdpTrustStrip lang="en" />);

    expect(screen.getByTestId("pdp-trust-strip")).toBeInTheDocument();
  });

  it("renders all four trust items", () => {
    render(<PdpTrustStrip lang="en" />);

    expect(screen.getByText(MOCK_TRUST_STRIP.delivery)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TRUST_STRIP.exchange)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TRUST_STRIP.origin)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TRUST_STRIP.securePayment)).toBeInTheDocument();
  });

  it("delivery item links to shipping policy", () => {
    render(<PdpTrustStrip lang="en" />);

    const deliveryLink = screen.getByRole("link", { name: MOCK_TRUST_STRIP.delivery });
    expect(deliveryLink).toHaveAttribute("href", expect.stringContaining("/en/shipping"));
  });

  it("exchange item links to returns policy", () => {
    render(<PdpTrustStrip lang="en" />);

    const exchangeLink = screen.getByRole("link", { name: MOCK_TRUST_STRIP.exchange });
    expect(exchangeLink).toHaveAttribute("href", expect.stringContaining("/en/returns"));
  });

  it("renders nothing when getTrustStripContent returns undefined", () => {
    mockGetTrustStripContent.mockReturnValue(undefined);

    const { container } = render(<PdpTrustStrip lang="en" />);
    expect(container.firstChild).toBeNull();
  });
});
