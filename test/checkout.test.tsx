import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";

import CheckoutForm from "../packages/ui/components/checkout/CheckoutForm";
import CancelledPage from "../apps/shop-abc/src/app/[lang]/cancelled/page";
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

jest.mock("@platform-core/src/contexts/CurrencyContext", () => ({
  useCurrency: () => ["EUR", () => {}],
}));

jest.mock("@shared-utils", () => ({ fetchJson: jest.fn() }));
import { fetchJson as fetchJsonMock } from "@shared-utils";

test("renders Elements once client secret is fetched", async () => {
  fetchJsonMock.mockResolvedValue({ clientSecret: "cs_test_123", sessionId: "sess_123" });

  render(<CheckoutForm locale="en" taxRegion="EU" />);

  expect(screen.getByText("Loading payment form…")).toBeInTheDocument();

  expect(await screen.findByTestId("payment-element")).toBeInTheDocument();
  expect(screen.queryByText("Loading payment form…")).toBeNull();
});

test("successful payment redirects to success", async () => {
  fetchJsonMock.mockResolvedValue({ clientSecret: "cs_test", sessionId: "sess" });
  confirmPaymentMock.mockResolvedValue({});

  render(<CheckoutForm locale="en" taxRegion="EU" />);
  await screen.findByTestId("payment-element");
  fireEvent.click(screen.getByRole("button", { name: /pay/i }));

  await waitFor(() => expect(confirmPaymentMock).toHaveBeenCalled());
  expect(confirmPaymentMock.mock.calls[0][0].confirmParams.return_url).toBe(
    "http://localhost/en/success"
  );
  expect(pushMock).toHaveBeenCalledWith("/en/success");
});

test("failed payment redirects to cancelled and shows error", async () => {
  fetchJsonMock.mockResolvedValue({ clientSecret: "cs_test", sessionId: "sess" });
  confirmPaymentMock.mockResolvedValue({ error: { message: "fail" } });

  render(<CheckoutForm locale="en" taxRegion="EU" />);
  await screen.findByTestId("payment-element");
  fireEvent.click(screen.getByRole("button", { name: /pay/i }));

  await waitFor(() => expect(confirmPaymentMock).toHaveBeenCalled());
  expect(pushMock).toHaveBeenCalledWith("/en/cancelled?error=fail");

  const url = new URL(pushMock.mock.calls[0][0], "http://localhost");
  cleanup();
  render(
    <CancelledPage searchParams={{ error: url.searchParams.get("error") ?? undefined }} />,
  );
  expect(await screen.findByText("fail")).toBeInTheDocument();
});

test("requests new session when return date changes", async () => {
  const calls: any[] = [];
  fetchJsonMock.mockImplementation(async (_url, opts) => {
    calls.push(JSON.parse((opts as any)?.body ?? "{}"));
    return {
      clientSecret: `cs_${calls.length}`,
      sessionId: `sess_${calls.length}`,
    };
  });

  const expectedDefault = isoDateInNDays(7);

  render(<CheckoutForm locale="en" taxRegion="EU" />);
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

test("default return date is 7 days ahead", async () => {
  fetchJsonMock.mockResolvedValue({ clientSecret: "cs", sessionId: "sess" });

  const expected = isoDateInNDays(7);

  render(<CheckoutForm locale="en" taxRegion="EU" />);
  await screen.findByTestId("payment-element");
  const input = screen.getByLabelText(/checkout\.return/i) as HTMLInputElement;
  expect(input.value).toBe(expected);
});
