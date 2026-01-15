import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as navigation from "next/navigation";
import CheckoutPanel from "@/components/checkout/CheckoutPanel";
import ThankYouPanel from "@/components/checkout/ThankYouPanel";
import type { Product } from "@/types/product";
import { listCochlearfitProducts } from "@/lib/cochlearfitCatalog.server";
import { renderWithProviders } from "./testUtils";
import { createCheckoutSession, fetchCheckoutSession } from "@/lib/checkout";

jest.mock("@/lib/checkout", () => ({
  createCheckoutSession: jest.fn(),
  fetchCheckoutSession: jest.fn(),
}));

const createCheckoutSessionMock = createCheckoutSession as jest.MockedFunction<
  typeof createCheckoutSession
>;
const fetchCheckoutSessionMock = fetchCheckoutSession as jest.MockedFunction<
  typeof fetchCheckoutSession
>;

const STORAGE_KEY = "cochlearfit:cart";

describe("checkout panels", () => {
  let products: Product[];

  beforeAll(async () => {
    products = await listCochlearfitProducts("en");
  });

  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
    createCheckoutSessionMock.mockReset();
    fetchCheckoutSessionMock.mockReset();
    const params = navigation.useSearchParams();
    params.delete("session_id");
  });

  it("disables checkout when cart is empty", () => {
    renderWithProviders(<CheckoutPanel products={products} />, { withCart: true });
    expect(screen.getByRole("button", { name: "Pay with Stripe" })).toBeDisabled();
  });

  it("redirects to Stripe on successful checkout", async () => {
    const user = userEvent.setup();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        items: [{ variantId: "classic-kids-sand", quantity: 1 }],
      })
    );

    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });

    createCheckoutSessionMock.mockResolvedValue({
      id: "sess_1",
      url: "https://stripe.test/checkout",
    });

    renderWithProviders(<CheckoutPanel products={products} />, { withCart: true });

    expect(await screen.findByText("Classic Secure")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pay with Stripe" }));

    await waitFor(() => {
      expect(createCheckoutSessionMock).toHaveBeenCalled();
      expect(window.location.href).toBe("https://stripe.test/checkout");
    });
  });

  it("shows errors when checkout fails", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        items: [{ variantId: "classic-kids-sand", quantity: 1 }],
      })
    );

    createCheckoutSessionMock.mockRejectedValue(new Error("fail"));

    renderWithProviders(<CheckoutPanel products={products} />, { withCart: true });
    await user.click(screen.getByRole("button", { name: "Pay with Stripe" }));

    expect(
      await screen.findByText("We couldn't start checkout. Please try again.")
    ).toBeInTheDocument();
  });

  it("renders missing session state when no session id is present", async () => {
    renderWithProviders(<ThankYouPanel />);
    expect(
      await screen.findByText("No checkout session found.")
    ).toBeInTheDocument();
  });

  it("renders success state for paid sessions", async () => {
    const params = navigation.useSearchParams();
    params.set("session_id", "sess_1");

    fetchCheckoutSessionMock.mockResolvedValue({
      id: "sess_1",
      paymentStatus: "paid",
      items: [
        {
          variantId: "classic-kids-sand",
          name: "product.classic.name",
          size: "kids",
          color: "sand",
          quantity: 1,
          unitPrice: 3400,
          currency: "USD",
        },
      ],
      total: 3400,
      currency: "USD",
    });

    renderWithProviders(<ThankYouPanel />);

    expect(await screen.findByText("Paid")).toBeInTheDocument();
    expect(screen.getByText(/Order reference/)).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    const params = navigation.useSearchParams();
    params.set("session_id", "sess_2");
    fetchCheckoutSessionMock.mockRejectedValue(new Error("fail"));

    renderWithProviders(<ThankYouPanel />);

    expect(
      await screen.findByText("We couldn't verify this session. Please contact support.")
    ).toBeInTheDocument();
  });
});
