import { render, screen } from "@testing-library/react";
import { rest, server } from "./mswServer";
process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";

import CheckoutForm from "../packages/ui/components/checkout/CheckoutForm";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@stripe/stripe-js", () => ({
  loadStripe: () => Promise.resolve({}),
}));

jest.mock("@stripe/react-stripe-js", () => {
  const React = require("react");
  return {
    Elements: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="elements">{children}</div>
    ),
    PaymentElement: () => <div data-testid="payment-element" />,
    useStripe: () => ({ confirmPayment: jest.fn() }),
    useElements: () => ({}),
  };
});

test("renders Elements once client secret is fetched", async () => {
  server.use(
    rest.post("/api/checkout-session", (_req, res, ctx) => {
      return res(
        ctx.json({ clientSecret: "cs_test_123", sessionId: "sess_123" })
      );
    })
  );

  render(<CheckoutForm locale="en" />);

  expect(screen.getByText("Loading payment form…")).toBeInTheDocument();

  expect(await screen.findByTestId("payment-element")).toBeInTheDocument();
  expect(screen.queryByText("Loading payment form…")).toBeNull();
});
