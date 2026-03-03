import { usePathname, useSearchParams } from "next/navigation";
import { render, waitFor } from "@testing-library/react";

import { logAnalyticsEvent } from "@acme/platform-core/analytics/client";

import CheckoutAnalytics from "./checkout/CheckoutAnalytics.client";
import ProductAnalytics from "./product/[slug]/ProductAnalytics.client";
import ShopAnalytics from "./shop/ShopAnalytics.client";
import SuccessAnalytics from "./success/SuccessAnalytics.client";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@acme/platform-core/analytics/client", () => ({
  logAnalyticsEvent: jest.fn().mockResolvedValue(undefined),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockLogAnalyticsEvent = logAnalyticsEvent as jest.MockedFunction<typeof logAnalyticsEvent>;

describe("Caryina analytics emitters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/en/shop");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("ShopAnalytics emits one page_view event", async () => {
    render(<ShopAnalytics locale="en" />);

    await waitFor(() => {
      expect(mockLogAnalyticsEvent).toHaveBeenCalledTimes(1);
    });
    expect(mockLogAnalyticsEvent).toHaveBeenCalledWith({
      type: "page_view",
      path: "/en/shop",
      locale: "en",
    });
  });

  it("CheckoutAnalytics emits page_view and checkout_started events", async () => {
    mockUsePathname.mockReturnValue("/en/checkout");

    render(<CheckoutAnalytics locale="en" value={12900} currency="EUR" />);

    await waitFor(() => {
      expect(mockLogAnalyticsEvent).toHaveBeenCalledTimes(2);
    });
    expect(mockLogAnalyticsEvent).toHaveBeenNthCalledWith(1, {
      type: "page_view",
      path: "/en/checkout",
      locale: "en",
    });
    expect(mockLogAnalyticsEvent).toHaveBeenNthCalledWith(2, {
      type: "checkout_started",
      value: 12900,
      currency: "EUR",
      locale: "en",
    });
  });

  it("ProductAnalytics emits page_view and product_view events", async () => {
    mockUsePathname.mockReturnValue("/en/product/caryina-mini");

    render(<ProductAnalytics locale="en" productId="sku-1" />);

    await waitFor(() => {
      expect(mockLogAnalyticsEvent).toHaveBeenCalledTimes(2);
    });
    expect(mockLogAnalyticsEvent).toHaveBeenNthCalledWith(1, {
      type: "page_view",
      path: "/en/product/caryina-mini",
      locale: "en",
    });
    expect(mockLogAnalyticsEvent).toHaveBeenNthCalledWith(2, {
      type: "product_view",
      productId: "sku-1",
      path: "/en/product/caryina-mini",
      locale: "en",
    });
  });

  it("SuccessAnalytics emits order_completed with parsed params", async () => {
    mockUsePathname.mockReturnValue("/en/success");
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams("orderId=ord-123&amount=8900&currency=EUR"),
    );

    render(<SuccessAnalytics locale="en" />);

    await waitFor(() => {
      expect(mockLogAnalyticsEvent).toHaveBeenCalledTimes(2);
    });

    expect(mockLogAnalyticsEvent).toHaveBeenNthCalledWith(1, {
      type: "page_view",
      path: "/en/success",
      locale: "en",
    });

    expect(mockLogAnalyticsEvent).toHaveBeenNthCalledWith(2, {
      type: "order_completed",
      path: "/en/success",
      locale: "en",
      orderId: "ord-123",
      amount: 8900,
      currency: "EUR",
    });
  });

  it("SuccessAnalytics drops non-numeric amount values", async () => {
    mockUsePathname.mockReturnValue("/en/success");
    mockUseSearchParams.mockReturnValue(new URLSearchParams("amount=not-a-number"));

    render(<SuccessAnalytics locale="en" />);

    await waitFor(() => {
      expect(mockLogAnalyticsEvent).toHaveBeenCalledTimes(2);
    });

    expect(mockLogAnalyticsEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ amount: undefined }),
    );
  });
});
