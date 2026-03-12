import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";

import { getSeoKeywords } from "@/lib/contentPacket";
import { finalizeStripeSession } from "@/lib/payments/stripeCheckout.server";

import SuccessPage, { generateMetadata } from "./page";

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
  getSeoKeywords: jest.fn(),
}));

jest.mock("@/lib/payments/stripeCheckout.server", () => ({
  finalizeStripeSession: jest.fn(),
}));

jest.mock("./SuccessAnalytics.client", () => ({
  __esModule: true,
  default: ({ locale }: { locale: string }) => (
    <div data-testid="success-analytics">{locale}</div>
  ),
}));

const mockGetSeoKeywords = getSeoKeywords as jest.MockedFunction<typeof getSeoKeywords>;
const mockFinalizeStripeSession =
  finalizeStripeSession as jest.MockedFunction<typeof finalizeStripeSession>;

describe("SuccessPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSeoKeywords.mockReturnValue(["order", "success"]);
  });

  it("generates metadata", async () => {
    const metadata = await generateMetadata();

    expect(metadata).toEqual({
      title: "Order Confirmed | Caryina",
      description: "Your Caryina order has been confirmed.",
      keywords: ["order", "success"],
    });
  });

  it("renders the generic confirmation flow when no Stripe session is present", async () => {
    const ui = (await SuccessPage({
      params: Promise.resolve({ lang: "it" }),
      searchParams: Promise.resolve({}),
    })) as ReactElement;

    render(ui);

    expect(screen.getByTestId("success-analytics")).toHaveTextContent("it");
    expect(screen.getByRole("heading", { name: "Order confirmed" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue shopping" })).toHaveAttribute(
      "href",
      "/it/shop",
    );
    expect(mockFinalizeStripeSession).not.toHaveBeenCalled();
  });

  it("renders Stripe not-paid state when hosted checkout payment is incomplete", async () => {
    mockFinalizeStripeSession.mockResolvedValue({
      state: "not_paid",
      paid: false,
      sessionId: "cs_test_123",
    });

    const ui = (await SuccessPage({
      params: Promise.resolve({ lang: "en" }),
      searchParams: Promise.resolve({ session_id: "cs_test_123" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByRole("heading", { name: "Payment not completed" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to cart" })).toHaveAttribute(
      "href",
      "/en/cart",
    );
  });

  it("renders Stripe paid confirmation with formatted amount", async () => {
    mockFinalizeStripeSession.mockResolvedValue({
      state: "finalized",
      paid: true,
      sessionId: "cs_test_123",
      amount: 9000,
      currency: "eur",
    });

    const ui = (await SuccessPage({
      params: Promise.resolve({ lang: "en" }),
      searchParams: Promise.resolve({ session_id: "cs_test_123" }),
    })) as ReactElement;

    render(ui);

    expect(screen.getByText(/Your payment of/)).toHaveTextContent("€90.00");
  });
});
