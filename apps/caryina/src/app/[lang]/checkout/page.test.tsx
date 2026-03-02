import { render, screen } from "@testing-library/react";

import { getSeoKeywords } from "@/lib/contentPacket";

import CheckoutPage, { generateMetadata } from "./page";

jest.mock("@/lib/contentPacket", () => ({
  getSeoKeywords: jest.fn(),
}));

jest.mock("./CheckoutClient.client", () => ({
  CheckoutClient: () => <div data-testid="checkout-client" />,
}));

const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;

describe("CheckoutPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["checkout", "caryina"]);
  });

  it("generates localized metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ lang: "it" }) });

    expect(metadata).toEqual({
      title: "Checkout (it) | Caryina",
      description: "Secure checkout for Caryina products.",
      keywords: ["checkout", "caryina"],
    });
  });

  it("renders the checkout client", () => {
    render(<CheckoutPage />);

    expect(screen.getByTestId("checkout-client")).toBeInTheDocument();
  });
});
