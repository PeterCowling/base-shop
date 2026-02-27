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
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "" },
    });
  });

  it("TC-05-01: fill form → success:true → redirect to /en/success", async () => {
    useCart.mockReturnValue([mockCart, mockDispatch]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<CheckoutClient />);

    expect(screen.getByText("Silver Ring")).toBeInTheDocument();

    fillCardForm();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /pay now/i }));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: "en",
          cardNumber: "4111111111111111",
          expiryMonth: "12",
          expiryYear: "2027",
          cvv: "123",
          buyerName: "",
          buyerEmail: "",
        }),
      });
    });

    await waitFor(() => {
      expect(window.location.href).toBe("/en/success");
    });
  });

  it("TC-05-02: fill form → success:false → error shown inline; button NOT disabled", async () => {
    useCart.mockReturnValue([mockCart, mockDispatch]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, error: "Card declined" }),
    });

    render(<CheckoutClient />);

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

  it("TC-05-03: fill form → network error → 'Something went wrong' shown", async () => {
    useCart.mockReturnValue([mockCart, mockDispatch]);
    global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));

    render(<CheckoutClient />);

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

  it("TC-05-04: submit WITHOUT filling card number → validation error shown, fetch NOT called", async () => {
    useCart.mockReturnValue([mockCart, mockDispatch]);
    global.fetch = jest.fn();

    render(<CheckoutClient />);

    // Only fill some fields, leave cardNumber empty
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

  it("shows empty state when cart has no items", () => {
    useCart.mockReturnValue([{}, mockDispatch]);
    render(<CheckoutClient />);
    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
  });
});
