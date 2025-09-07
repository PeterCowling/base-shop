import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutForm from "../src/components/checkout/CheckoutForm";

const fetchJson = jest.fn();
const confirmPayment = jest.fn();
const push = jest.fn();
const useStripeMock = jest.fn();
const useElementsMock = jest.fn();

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@acme/shared-utils", () => ({
  fetchJson: (...args: unknown[]) => fetchJson(...args),
}));

jest.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PaymentElement: () => <div>payment-element</div>,
  useStripe: () => useStripeMock(),
  useElements: () => useElementsMock(),
}));

jest.mock("@stripe/stripe-js", () => ({
  loadStripe: jest.fn().mockResolvedValue({}),
}));

beforeEach(() => {
  fetchJson.mockReset();
  confirmPayment.mockReset();
  push.mockReset();
  useStripeMock.mockReturnValue({ confirmPayment });
  useElementsMock.mockReturnValue({});
});

describe("CheckoutForm", () => {
  it("shows loading and retries on failure", async () => {
    fetchJson.mockRejectedValueOnce(new Error("fail"));
    fetchJson.mockResolvedValueOnce({ clientSecret: "cs" });

    render(<CheckoutForm locale="en" taxRegion="eu" />);

    expect(screen.getByText("checkout.loading")).toBeInTheDocument();

    const retry = await screen.findByRole("button", { name: "checkout.retry" });
    expect(screen.getByText("checkout.loadError")).toBeInTheDocument();

    await userEvent.click(retry);

    await screen.findByRole("button", { name: "checkout.pay" });
    expect(fetchJson).toHaveBeenCalledTimes(2);
  });

  it("redirects on successful payment", async () => {
    fetchJson.mockResolvedValue({ clientSecret: "cs" });
    confirmPayment.mockResolvedValue({});

    render(<CheckoutForm locale="en" taxRegion="eu" />);
    const pay = await screen.findByRole("button", { name: "checkout.pay" });

    await userEvent.click(pay);

    expect(confirmPayment).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/en/success");
  });

  it("redirects to cancelled on payment error", async () => {
    fetchJson.mockResolvedValue({ clientSecret: "cs" });
    confirmPayment.mockResolvedValue({ error: { message: "nope" } });

    render(<CheckoutForm locale="en" taxRegion="eu" />);
    const pay = await screen.findByRole("button", { name: "checkout.pay" });

    await userEvent.click(pay);

    expect(push).toHaveBeenCalledWith("/en/cancelled?error=nope");
  });

  it("blocks submission when stripe objects are missing", async () => {
    fetchJson.mockResolvedValue({ clientSecret: "cs" });
    useStripeMock.mockReturnValue(null);
    useElementsMock.mockReturnValue(null);

    render(<CheckoutForm locale="en" taxRegion="eu" />);
    const pay = await screen.findByRole("button", { name: "checkout.pay" });

    await userEvent.click(pay);

    expect(confirmPayment).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});

