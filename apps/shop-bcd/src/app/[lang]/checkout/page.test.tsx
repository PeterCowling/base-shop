import type { ReactElement } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CheckoutPage from "./page";
import shop from "../../../../shop.json";
import type { DeliverySchedulerProps } from "@ui/components/organisms/DeliveryScheduler";

const cookiesMock = jest.fn();
jest.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

type DecodeCartCookie = typeof import("@platform-core/cartCookie").decodeCartCookie;
const decodeCartCookieMock: jest.Mock<
  ReturnType<DecodeCartCookie>,
  Parameters<DecodeCartCookie>
> = jest.fn();
jest.mock("@platform-core/cartCookie", () => {
  const actual = jest.requireActual("@platform-core/cartCookie");
  return {
    ...actual,
    decodeCartCookie: (...args: Parameters<DecodeCartCookie>) =>
      decodeCartCookieMock(...args),
  };
});

type GetShopSettings = typeof import("@platform-core/repositories/settings.server").getShopSettings;
const getShopSettingsMock: jest.Mock<
  ReturnType<GetShopSettings>,
  Parameters<GetShopSettings>
> = jest.fn();
jest.mock("@platform-core/repositories/settings.server", () => ({
  getShopSettings: (...args: Parameters<GetShopSettings>) =>
    getShopSettingsMock(...args),
}));

jest.mock("@ui/components/checkout/CheckoutForm", () => {
  function MockCheckoutForm() {
    return <div data-cy="checkout-form" />;
  }
  MockCheckoutForm.displayName = "MockCheckoutForm";
  return MockCheckoutForm;
});
jest.mock("@ui/components/organisms/OrderSummary", () => {
  function MockOrderSummary() {
    return <div data-cy="order-summary" />;
  }
  MockOrderSummary.displayName = "MockOrderSummary";
  return MockOrderSummary;
});

type DeliverySchedulerOnChange = NonNullable<DeliverySchedulerProps["onChange"]>;

const DeliverySchedulerStub = ({ onChange }: { onChange?: DeliverySchedulerOnChange }) => (
  <button
    data-cy="delivery-scheduler"
    onClick={() => onChange({ region: "us", window: "am", date: "2024-01-01" })}
  >
    schedule
  </button>
);
jest.mock("@ui/components/organisms", () => ({
  DeliveryScheduler: (props: DeliverySchedulerProps) => DeliverySchedulerStub(props),
}));

const originalShippingProviders = [...(shop.shippingProviders || [])];
const originalFetch = global.fetch;

afterEach(() => {
  cookiesMock.mockReset();
  decodeCartCookieMock.mockReset();
  getShopSettingsMock.mockReset();
  global.fetch = originalFetch;
  shop.shippingProviders = [...originalShippingProviders];
});

describe("CheckoutPage", () => {
  it("renders empty state when no cart cookie", async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    decodeCartCookieMock.mockReturnValue(undefined);

    const ui = (await CheckoutPage({ params: Promise.resolve({ lang: "en" }) })) as ReactElement;
    render(ui);
    expect(screen.getByText("Your cart is empty.")).toBeInTheDocument();
  });

  it("renders order summary without premier delivery when cart has items", async () => {
    cookiesMock.mockResolvedValue({ get: () => ({ value: "cookie" }) });
    decodeCartCookieMock.mockReturnValue({ line: {} });
    getShopSettingsMock.mockResolvedValue({ taxRegion: "US" });

    const ui = (await CheckoutPage({ params: Promise.resolve({ lang: "en" }) })) as ReactElement;
    render(ui);

    expect(screen.getByTestId("order-summary")).toBeInTheDocument();
    expect(screen.queryByTestId("delivery-scheduler")).not.toBeInTheDocument();
  });

  it("shows premier delivery picker and posts selection", async () => {
    shop.shippingProviders = ["premier-shipping"]; // enable premier shipping
    cookiesMock.mockResolvedValue({ get: () => ({ value: "cookie" }) });
    decodeCartCookieMock.mockReturnValue({ line: {} });
    getShopSettingsMock.mockResolvedValue({
      taxRegion: "US",
      premierDelivery: { windows: ["am"], regions: ["us"] },
    });

    const fetchMock: jest.Mock<Promise<Response>, [RequestInfo | URL, RequestInit?]> = jest.fn(
      () => Promise.resolve(new Response(null)),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const ui = (await CheckoutPage({ params: Promise.resolve({ lang: "en" }) })) as ReactElement;
    render(ui);

    const picker = screen.getByTestId("delivery-scheduler");
    fireEvent.click(picker);

    expect(screen.getByTestId("order-summary")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/delivery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region: "us", date: "2024-01-01", window: "am" }),
    });
  });
});
