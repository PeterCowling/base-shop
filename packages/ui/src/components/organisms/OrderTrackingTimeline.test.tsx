import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OrderTrackingTimeline } from "./OrderTrackingTimeline";

describe("OrderTrackingTimeline", () => {
  it("renders multiple steps with correct active and completed styles", () => {
    const steps = [
      { label: "Order placed", complete: true },
      { label: "Shipped", complete: true },
      { label: "Out for delivery", complete: false },
    ];

    render(<OrderTrackingTimeline steps={steps} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);

    const placedBullet = screen.getByText("Order placed").previousSibling as HTMLElement;
    expect(placedBullet).toHaveClass("bg-primary", "text-primary-foreground");
    expect(placedBullet.querySelector("svg")).not.toBeNull();

    const shippedBullet = screen.getByText("Shipped").previousSibling as HTMLElement;
    expect(shippedBullet).toHaveClass("bg-primary", "text-primary-foreground");
    expect(shippedBullet.querySelector("svg")).not.toBeNull();

    const deliveryBullet = screen.getByText("Out for delivery").previousSibling as HTMLElement;
    expect(deliveryBullet).toHaveClass("bg-muted", "text-muted-foreground");
    expect(deliveryBullet.querySelector("svg")).toBeNull();
  });
});

