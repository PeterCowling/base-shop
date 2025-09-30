import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
const translations: Record<string, string> = {
  "order.tracking.title": "Track your order",
  "order.reference": "Order ref",
  "order.shippingTo": "Shipping to",
};

jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) => translations[key] ?? key,
}));

import { OrderTrackingTemplate } from "../OrderTrackingTemplate";

describe("OrderTrackingTemplate", () => {
  it("renders address and forwards steps", () => {
    const steps = [{ label: "Shipped" }];
    render(
      <OrderTrackingTemplate
        orderId="ABC123"
        address="123 Main St"
        steps={steps}
      />
    );

    expect(
      screen.getByText("Shipping to 123 Main St")
    ).toBeInTheDocument();
    expect(screen.getByText("Shipped")).toBeInTheDocument();
  });
});
