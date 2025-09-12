import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
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
