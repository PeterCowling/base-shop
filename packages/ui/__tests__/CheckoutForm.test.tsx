import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutForm from "../src/components/checkout/CheckoutForm";
import * as RHF from "react-hook-form";

const fetchJson = jest.fn();
const confirm = jest.fn();
const push = jest.fn();
const useCheckoutMock = jest.fn();
let consoleError: jest.SpyInstance;

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
  CheckoutProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PaymentElement: () => <div>payment-element</div>,
  useCheckout: () => useCheckoutMock(),
}));

jest.mock("@stripe/stripe-js", () => ({
  loadStripe: jest.fn().mockResolvedValue({}),
}));

jest.mock("react-hook-form", () => {
  const actual = jest.requireActual("react-hook-form");
  return { ...actual, useForm: jest.fn(actual.useForm) };
});

beforeEach(() => {
  fetchJson.mockReset();
  confirm.mockReset();
  push.mockReset();
  useCheckoutMock.mockReturnValue({ canConfirm: true, confirm });
  (RHF.useForm as jest.Mock).mockImplementation(
    (jest.requireActual("react-hook-form") as any).useForm
  );
  consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe("CheckoutForm", () => {
  it("handles unknown rejections with retry", async () => {
    fetchJson.mockRejectedValueOnce({});
    fetchJson.mockResolvedValueOnce({ clientSecret: "cs" });

    render(<CheckoutForm locale="en" taxRegion="eu" />);

    const retry = await screen.findByRole("button", { name: "checkout.retry" });
    expect(screen.getByText("checkout.loadError")).toBeInTheDocument();

    await userEvent.click(retry);

    // Elements should render once a clientSecret is available
    await screen.findByText("payment-element");
    await screen.findByRole("button", { name: "checkout.pay" });
    expect(fetchJson).toHaveBeenCalledTimes(2);
  });

  it("ignores AbortError without showing error UI", async () => {
    fetchJson.mockRejectedValue(new DOMException("aborted", "AbortError"));

    render(<CheckoutForm locale="en" taxRegion="eu" />);

    await waitFor(() => {
      expect(screen.getByText("checkout.loading")).toBeInTheDocument();
      expect(
        screen.queryByText("checkout.loadError")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "checkout.retry" })
      ).not.toBeInTheDocument();
    });
  });

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
    confirm.mockResolvedValue({ type: "success", session: { id: "csess" } });

    render(<CheckoutForm locale="en" taxRegion="eu" />);
    // Ensure the Elements tree is mounted with the PaymentElement
    await screen.findByText("payment-element");
    const pay = await screen.findByRole("button", { name: "checkout.pay" });

    await userEvent.click(pay);

    expect(confirm).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/en/success?orderId=csess&currency=USD");
  });

  it("redirects to cancelled on payment error", async () => {
    fetchJson.mockResolvedValue({ clientSecret: "cs" });
    confirm.mockResolvedValue({ type: "error", error: { message: "nope" } });

    render(<CheckoutForm locale="en" taxRegion="eu" />);
    await screen.findByText("payment-element");
    const pay = await screen.findByRole("button", { name: "checkout.pay" });

    await userEvent.click(pay);

    expect(push).toHaveBeenCalledWith("/en/cancelled?error=nope");
  });

  it("blocks submission when stripe objects are missing", async () => {
    fetchJson.mockResolvedValue({ clientSecret: "cs" });
    useCheckoutMock.mockReturnValue({ canConfirm: false, confirm });

    render(<CheckoutForm locale="en" taxRegion="eu" />);
    const pay = await screen.findByRole("button", { name: "checkout.pay" });

    await userEvent.click(pay);

    expect(confirm).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("focuses returnDate when missing", async () => {
    fetchJson.mockResolvedValue({ clientSecret: "cs" });

    const setFocus = jest.fn();
    const useFormMock = RHF.useForm as jest.Mock;
    useFormMock.mockImplementation((...args) => {
      const methods = (jest.requireActual("react-hook-form") as any).useForm(
        ...args,
      );
      return { ...methods, setFocus } as any;
    });

    render(<CheckoutForm locale="en" taxRegion="eu" />);
    await screen.findByRole("button", { name: "checkout.pay" });

    const dateInput = screen.getByLabelText("checkout.return");
    await userEvent.clear(dateInput);
    await userEvent.click(screen.getByRole("button", { name: "checkout.pay" }));

    expect(setFocus).toHaveBeenCalledWith("returnDate");
  });
});
