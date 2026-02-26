import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CheckoutClient } from "./CheckoutClient.client";

jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useParams: jest.fn(() => ({ lang: "en" })),
  usePathname: jest.fn(() => "/en/checkout"),
}));

jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "Link";
  return MockLink;
});

jest.mock("@acme/platform-core/analytics/client", () => ({
  logAnalyticsEvent: jest.fn().mockResolvedValue(undefined),
}));

const { useCart } = jest.requireMock("@acme/platform-core/contexts/CartContext") as {
  useCart: jest.Mock;
};

const mockDispatch = jest.fn().mockResolvedValue(undefined);

const mockSku = {
  id: "sku-1",
  title: "Silver Ring",
  price: 4500,
  stock: 5,
  sizes: [],
  slug: "silver-ring",
  description: "",
  deposit: 0,
  media: [],
  status: "active",
};

const mockCart = { "sku-1": { sku: mockSku, qty: 2 } };

describe("CheckoutClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "" },
    });
  });

  it("TC-01: Pay now triggers POST /api/checkout-session and redirects", async () => {
    useCart.mockReturnValue([mockCart, mockDispatch]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ sessionId: "sess_test", url: "https://checkout.stripe.com/test" }),
    });

    render(<CheckoutClient />);

    expect(screen.getByText("Silver Ring")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /pay now/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: "en" }),
      });
    });

    await waitFor(() => {
      expect(window.location.href).toBe("https://checkout.stripe.com/test");
    });
  });

  it("shows error when fetch returns non-ok", async () => {
    useCart.mockReturnValue([mockCart, mockDispatch]);
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    render(<CheckoutClient />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /pay now/i }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Payment failed to initiate — please try again.",
    );
  });

  it("shows empty state when cart has no items", () => {
    useCart.mockReturnValue([{}, mockDispatch]);
    render(<CheckoutClient />);
    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
  });
});
