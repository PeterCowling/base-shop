import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { rest, server } from "./mswServer";
process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";

import CheckoutForm from "../packages/ui/components/checkout/CheckoutForm";

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("@stripe/stripe-js", () => ({
  loadStripe: () => Promise.resolve({}),
}));

const confirmPaymentMock = jest.fn();

jest.mock("@stripe/react-stripe-js", () => {
  const React = require("react");
  return {
    Elements: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="elements">{children}</div>
    ),
    PaymentElement: () => <div data-testid="payment-element" />,
    useStripe: () => ({ confirmPayment: confirmPaymentMock }),
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

test("successful payment redirects to success", async () => {
  server.use(
    rest.post("/api/checkout-session", (_req, res, ctx) =>
      res(ctx.json({ clientSecret: "cs_test", sessionId: "sess" }))
    )
  );
  confirmPaymentMock.mockResolvedValue({});

  render(<CheckoutForm locale="en" />);
  await screen.findByTestId("payment-element");
  fireEvent.click(screen.getByRole("button", { name: /pay/i }));

  await waitFor(() => expect(confirmPaymentMock).toHaveBeenCalled());
  expect(pushMock).toHaveBeenCalledWith("/en/success");
});

test("failed payment redirects to cancelled", async () => {
  server.use(
    rest.post("/api/checkout-session", (_req, res, ctx) =>
      res(ctx.json({ clientSecret: "cs_test", sessionId: "sess" }))
    )
  );
  confirmPaymentMock.mockResolvedValue({ error: { message: "fail" } });

  render(<CheckoutForm locale="en" />);
  await screen.findByTestId("payment-element");
  fireEvent.click(screen.getByRole("button", { name: /pay/i }));

  await waitFor(() => expect(confirmPaymentMock).toHaveBeenCalled());
  expect(pushMock).toHaveBeenCalledWith("/en/cancelled");
  expect(await screen.findByText("fail")).toBeInTheDocument();
});
