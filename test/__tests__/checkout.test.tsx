import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";

import CheckoutForm from "../../packages/ui/src/components/checkout/CheckoutForm";
import { CurrencyProvider } from "@acme/platform-core/contexts/CurrencyContext";
import { isoDateInNDays } from "@acme/date-utils";
import * as sharedUtils from "@acme/shared-utils";

jest.mock("@acme/shared-utils", () => ({
  fetchJson: jest.fn(),
}));

const mockFetchJson = sharedUtils.fetchJson as jest.MockedFunction<
  typeof sharedUtils.fetchJson
>;

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(globalThis.location.search),
}));

const Cancelled = require("../../packages/template-app/src/app/cancelled/page").default;

jest.mock("@stripe/stripe-js", () => ({
  loadStripe: () => Promise.resolve({}),
}));

const mockConfirmPayment = jest.fn();

jest.mock("@stripe/react-stripe-js", () => {
  const React = require("react");
  return {
    Elements: ({ children }: { children: React.ReactNode }) =>
      React.createElement("div", { "data-testid": "elements" }, children),
    PaymentElement: () =>
      React.createElement("div", { "data-testid": "payment-element" }),
    useStripe: () => ({ confirmPayment: mockConfirmPayment }),
    useElements: () => ({}),
  };
});

jest.mock("@acme/platform-core/contexts/CurrencyContext", () =>
  require("../__mocks__/currencyContextMock")
);

beforeEach(() => {
  mockConfirmPayment.mockReset();
  mockFetchJson.mockReset();
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  cleanup();
});

test("renders Elements once client secret is fetched", async () => {
  mockFetchJson.mockResolvedValue({
    clientSecret: "cs_test_123",
    sessionId: "sess_123",
  } as any);

  render(
    <CurrencyProvider>
      <CheckoutForm locale="en" taxRegion="EU" />
    </CurrencyProvider>
  );

  expect(screen.getByText(/checkout\.loading/i)).toBeInTheDocument();

  expect(await screen.findByTestId("payment-element")).toBeInTheDocument();
  expect(screen.queryByText(/checkout\.loading/i)).toBeNull();
});

test("successful payment redirects to success", async () => {
  mockFetchJson.mockResolvedValue({
    clientSecret: "cs_test",
    sessionId: "sess",
  } as any);
  mockConfirmPayment.mockResolvedValue({});

  render(
    <CurrencyProvider>
      <CheckoutForm locale="en" taxRegion="EU" />
    </CurrencyProvider>
  );
  await screen.findByTestId("payment-element");
  fireEvent.click(screen.getByRole("button", { name: /pay/i }));

  await waitFor(() => expect(mockConfirmPayment).toHaveBeenCalled());
  expect(mockConfirmPayment.mock.calls[0][0].confirmParams.return_url).toBe(
    "http://localhost/en/success"
  );
  expect(mockPush).toHaveBeenCalledWith("/en/success");
});

test("failed payment redirects to cancelled with error message", async () => {
  mockFetchJson.mockResolvedValue({
    clientSecret: "cs_test",
    sessionId: "sess",
  } as any);
  mockConfirmPayment.mockResolvedValue({ error: { message: "fail" } });

  const { unmount } = render(
    <CurrencyProvider>
      <CheckoutForm locale="en" taxRegion="EU" />
    </CurrencyProvider>
  );
  await screen.findByTestId("payment-element");
  fireEvent.click(screen.getByRole("button", { name: /pay/i }));

  await waitFor(() => expect(mockConfirmPayment).toHaveBeenCalled());
  expect(mockPush).toHaveBeenCalledWith("/en/cancelled?error=fail");
  unmount();
  window.history.replaceState(null, "", "/en/cancelled?error=fail");
  render(<Cancelled />);
  expect(screen.getByText("fail")).toBeInTheDocument();
});

test("requests new session when return date changes", async () => {
  const calls: any[] = [];
  mockFetchJson.mockImplementation(async (_input, init) => {
    calls.push(JSON.parse((init?.body as string) || "{}"));
    return {
      clientSecret: `cs_${calls.length}`,
      sessionId: `sess_${calls.length}`,
    } as any;
  });

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
  mockFetchJson.mockImplementation(async (_input, init) => {
    calls.push(JSON.parse((init?.body as string) || "{}"));
    return {
      clientSecret: `cs_${calls.length}`,
      sessionId: `sess_${calls.length}`,
    } as any;
  });

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
  mockFetchJson.mockResolvedValue({
    clientSecret: "cs",
    sessionId: "sess",
  } as any);

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

test("shows fallback when session request fails", async () => {
  mockFetchJson.mockRejectedValueOnce(new Error("fail"));

  render(
    <CurrencyProvider>
      <CheckoutForm locale="en" taxRegion="EU" />
    </CurrencyProvider>
  );

  expect(
    await screen.findByText(/checkout\.loaderror/i, undefined, {
      timeout: 3000,
    })
  ).toBeInTheDocument();
});
