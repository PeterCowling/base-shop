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

function fillCardForm() {
  fireEvent.change(screen.getByLabelText(/card number/i), {
    target: { name: "cardNumber", value: "4111111111111111" },
  });
  fireEvent.change(screen.getByLabelText(/expiry month/i), {
    target: { name: "expiryMonth", value: "12" },
  });
  fireEvent.change(screen.getByLabelText(/expiry year/i), {
    target: { name: "expiryYear", value: "2027" },
  });
  fireEvent.change(screen.getByLabelText(/cvv/i), {
    target: { name: "cvv", value: "123" },
  });
}

describe("CheckoutClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCart.mockReturnValue([mockCart, mockDispatch]);
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "" },
    });
  });

  it("TC-05-01: Axerve success redirects to the local success page", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<CheckoutClient provider="axerve" />);

    fillCardForm();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /pay now/i }));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.any(String),
      });
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { body: string },
    ];
    const payload = JSON.parse(fetchCall[1].body) as Record<string, string>;
    expect(payload).toEqual(
      expect.objectContaining({
        idempotencyKey: expect.any(String),
        lang: "en",
        acceptedLegalTerms: true,
        cardNumber: "4111111111111111",
        expiryMonth: "12",
        expiryYear: "2027",
        cvv: "123",
        buyerName: "",
        buyerEmail: "",
      }),
    );

    await waitFor(() => {
      expect(window.location.href).toBe("/en/success");
    });
  });

  it("TC-05-02: Axerve decline stays inline and leaves retry enabled", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: "Card declined" }),
    });

    render(<CheckoutClient provider="axerve" />);

    fillCardForm();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /pay now/i }));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Card declined");
    });

    expect(screen.getByRole("button", { name: /pay now/i })).not.toBeDisabled();
  });

  it("TC-05-03: Axerve network error shows the generic retry copy", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));

    render(<CheckoutClient provider="axerve" />);

    fillCardForm();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /pay now/i }));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Something went wrong — please try again.",
      );
    });
  });

  it("TC-05-04: Axerve validates card fields before posting", () => {
    global.fetch = jest.fn();

    render(<CheckoutClient provider="axerve" />);

    fireEvent.change(screen.getByLabelText(/expiry month/i), {
      target: { name: "expiryMonth", value: "12" },
    });
    fireEvent.change(screen.getByLabelText(/expiry year/i), {
      target: { name: "expiryYear", value: "2027" },
    });
    fireEvent.change(screen.getByLabelText(/cvv/i), {
      target: { name: "cvv", value: "123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /pay now/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please fill in all required card fields.",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("TC-05-05: Stripe mode hides card fields and redirects to the hosted checkout URL", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        mode: "redirect",
        provider: "stripe",
        sessionId: "cs_test_123",
        url: "https://checkout.stripe.com/c/pay/cs_test_123",
      }),
    });

    render(<CheckoutClient provider="stripe" />);

    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
    expect(screen.getByText("Secure Stripe checkout")).toBeInTheDocument();
    expect(
      screen.getByText(/delivery timing shown before payment is estimated/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Terms of Sale and Website Use/i })).toHaveAttribute(
      "href",
      "/en/terms",
    );
    expect(screen.getByRole("link", { name: /Privacy Policy/i })).toHaveAttribute(
      "href",
      "/en/privacy",
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /pay now/i }));
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      { body: string },
    ];
    const payload = JSON.parse(fetchCall[1].body) as Record<string, string>;
    expect(payload).toEqual(
      expect.objectContaining({
        idempotencyKey: expect.any(String),
        lang: "en",
        acceptedLegalTerms: true,
      }),
    );
    expect(payload).not.toHaveProperty("cardNumber");
    expect(
      screen.getByRole("checkbox", {
        name: /i agree to the caryina legal policies before paying/i,
      }),
    ).toBeChecked();

    await waitFor(() => {
      expect(window.location.href).toBe("https://checkout.stripe.com/c/pay/cs_test_123");
    });
  });

  it("TC-05-06: Stripe mode reports a missing hosted checkout URL", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, mode: "redirect", provider: "stripe" }),
    });

    render(<CheckoutClient provider="stripe" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /pay now/i }));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "No checkout URL returned — please try again.",
      );
    });
  });

  it("shows empty state when cart has no items", () => {
    useCart.mockReturnValue([{}, mockDispatch]);
    render(<CheckoutClient provider="stripe" />);
    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
  });
});
