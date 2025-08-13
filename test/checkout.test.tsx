import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { server } from "./msw/server";
process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";

import CheckoutForm from "../packages/ui/components/checkout/CheckoutForm";
import { CurrencyProvider } from "@platform-core/src/contexts/CurrencyContext";
import { isoDateInNDays } from "@acme/date-utils";

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

jest.mock("@platform-core/src/contexts/CurrencyContext", () =>
  require("./__mocks__/currencyContextMock")
);

afterEach(() => {
  confirmPaymentMock.mockReset();
});

test("renders Elements once client secret is fetched", async () => {
  server.use(
    rest.post("/api/checkout-session", (_req, res, ctx) => {
      return res(
        ctx.json({ clientSecret: "cs_test_123", sessionId: "sess_123" })
      );
    })
  );

  render(
    <CurrencyProvider>
      <CheckoutForm locale="en" taxRegion="EU" />
    </CurrencyProvider>
  );

  expect(screen.getByText("Loading payment form…")).toBeInTheDocument();

  expect(await screen.findByTestId("payment-element")).toBeInTheDocument();
  expect(screen.queryByText("Loading payment form…")).toBeNull();
});

test("successful payment redirects to success", async () => {
  server.use(
    rest.post("/api/checkout-session", (_req, res, ctx) => {
      return res(ctx.json({ clientSecret: "cs_test", sessionId: "sess" }));
    })
  );
  confirmPaymentMock.mockResolvedValue({});

  render(
    <CurrencyProvider>
      <CheckoutForm locale="en" taxRegion="EU" />
    </CurrencyProvider>
  );
  await screen.findByTestId("payment-element");
  fireEvent.click(screen.getByRole("button", { name: /pay/i }));

  await waitFor(() => expect(confirmPaymentMock).toHaveBeenCalled());
  expect(confirmPaymentMock.mock.calls[0][0].confirmParams.return_url).toBe(
    "http://localhost/en/success"
  );
  expect(pushMock).toHaveBeenCalledWith("/en/success");
});

test("failed payment redirects to cancelled", async () => {
  server.use(
    rest.post("/api/checkout-session", (_req, res, ctx) => {
      return res(ctx.json({ clientSecret: "cs_test", sessionId: "sess" }));
    })
  );
  confirmPaymentMock.mockResolvedValue({ error: { message: "fail" } });

  render(
    <CurrencyProvider>
      <CheckoutForm locale="en" taxRegion="EU" />
    </CurrencyProvider>
  );
  await screen.findByTestId("payment-element");
  fireEvent.click(screen.getByRole("button", { name: /pay/i }));

  await waitFor(() => expect(confirmPaymentMock).toHaveBeenCalled());
  expect(pushMock).toHaveBeenCalledWith("/en/cancelled");
  expect(await screen.findByText("fail")).toBeInTheDocument();
});

test("requests new session when return date changes", async () => {
  const calls: any[] = [];
  server.use(
    rest.post("/api/checkout-session", async (req, res, ctx) => {
      calls.push(await req.json());
      return res(
        ctx.json({
          clientSecret: `cs_${calls.length}`,
          sessionId: `sess_${calls.length}`,
        })
      );
    })
  );

  const expectedDefault = isoDateInNDays(7);

  render(
    <CurrencyProvider>
      <CheckoutForm locale="en" taxRegion="EU" />
    </CurrencyProvider>
  );
  await screen.findByTestId("payment-element");
  expect(calls[0].returnDate).toBe(expectedDefault);
  expect(calls[0].currency).toBe("EUR");
  expect(calls[0].taxRegion).toBe("EU");

  const input = screen.getByLabelText(/checkout\.return/i);
  fireEvent.change(input, { target: { value: "2025-12-25" } });

  await waitFor(() => expect(calls).toHaveLength(2));
  expect(calls[1].returnDate).toBe("2025-12-25");
  expect(calls[1].currency).toBe("EUR");
  expect(calls[1].taxRegion).toBe("EU");
});

test("only final return date triggers request", async () => {
  const calls: any[] = [];
  server.use(
    rest.post("/api/checkout-session", async (req, res, ctx) => {
      calls.push(await req.json());
      return res(
        ctx.json({
          clientSecret: `cs_${calls.length}`,
          sessionId: `sess_${calls.length}`,
        })
      );
    })
  );

  render(
    <CurrencyProvider>
      <CheckoutForm locale="en" taxRegion="EU" />
    </CurrencyProvider>
  );
  await screen.findByTestId("payment-element");

  const input = screen.getByLabelText(/checkout\.return/i);
  fireEvent.change(input, { target: { value: "2025-12-24" } });
  fireEvent.change(input, { target: { value: "2025-12-25" } });
  fireEvent.change(input, { target: { value: "2025-12-26" } });

  await waitFor(() => expect(calls).toHaveLength(2));
  expect(calls[1].returnDate).toBe("2025-12-26");
});

test("default return date is 7 days ahead", async () => {
  server.use(
    rest.post("/api/checkout-session", (_req, res, ctx) => {
      return res(ctx.json({ clientSecret: "cs", sessionId: "sess" }));
    })
  );

  const expected = isoDateInNDays(7);

  render(
    <CurrencyProvider>
      <CheckoutForm locale="en" taxRegion="EU" />
    </CurrencyProvider>
  );
  await screen.findByTestId("payment-element");
  const input = screen.getByLabelText(/checkout\.return/i) as HTMLInputElement;
  expect(input.value).toBe(expected);
});
