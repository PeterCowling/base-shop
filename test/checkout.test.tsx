import { fireEvent, render, screen, waitFor } from "@testing-library/react";
process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";

const fetchJsonMock = jest.fn();
jest.mock("@shared-utils", () => ({ fetchJson: fetchJsonMock }));

import { isoDateInNDays } from "@acme/date-utils";
import Cancelled from "../packages/template-app/src/app/cancelled/page";
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

beforeEach(() => {
  fetchJsonMock.mockReset();
});

const CheckoutForm = require("../packages/ui/components/checkout/CheckoutForm").default;

jest.mock("@platform-core/src/contexts/CurrencyContext", () =>
  require("./__mocks__/currencyContextMock")
);

test("renders Elements once client secret is fetched", async () => {
  fetchJsonMock.mockResolvedValueOnce({
    clientSecret: "cs_test_123",
    sessionId: "sess_123",
  });

  render(<CheckoutForm locale="en" taxRegion="EU" />);

  expect(screen.getByText("Loading payment form…")).toBeInTheDocument();

  expect(await screen.findByTestId("payment-element")).toBeInTheDocument();
  expect(screen.queryByText("Loading payment form…")).toBeNull();
});

test("successful payment redirects to success", async () => {
  fetchJsonMock.mockResolvedValueOnce({
    clientSecret: "cs_test",
    sessionId: "sess",
  });
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

test("failed payment redirects to cancelled with error message", async () => {
  fetchJsonMock.mockResolvedValueOnce({
    clientSecret: "cs_test",
    sessionId: "sess",
  });
  confirmPaymentMock.mockResolvedValue({ error: { message: "fail" } });

  const { unmount } = render(
    <CheckoutForm locale="en" taxRegion="EU" />
  );
  await screen.findByTestId("payment-element");
  fireEvent.click(screen.getByRole("button", { name: /pay/i }));

  await waitFor(() => expect(confirmPaymentMock).toHaveBeenCalled());
  expect(pushMock).toHaveBeenCalledWith("/en/cancelled?error=fail");

  // simulate visiting the cancelled page and ensure the error is shown
  unmount();
  const url = new URL(pushMock.mock.calls[0][0], "http://localhost");
  render(
    <Cancelled searchParams={{ error: url.searchParams.get("error") ?? undefined }} />
  );
  expect(await screen.findByText("fail")).toBeInTheDocument();
});

test("requests new session when return date changes", async () => {
  const calls: any[] = [];
  fetchJsonMock.mockImplementation(async (url, opts) => {
    calls.push(JSON.parse((opts as any).body));
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
  fetchJsonMock.mockResolvedValueOnce({ clientSecret: "cs", sessionId: "sess" });

  const expected = isoDateInNDays(7);

  render(<CheckoutForm locale="en" taxRegion="EU" />);
  await screen.findByTestId("payment-element");
  const input = screen.getByLabelText(/checkout\.return/i) as HTMLInputElement;
  expect(input.value).toBe(expected);
});
