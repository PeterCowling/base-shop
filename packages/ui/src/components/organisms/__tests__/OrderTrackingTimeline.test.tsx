/* i18n-exempt file -- tests assert literal labels and copy */
import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { OrderTrackingTimeline } from "../OrderTrackingTimeline";

describe("OrderTrackingTimeline", () => {
  it("returns null when tracking is disabled", () => {
    const { container } = render(
      <OrderTrackingTimeline trackingEnabled={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when steps array is empty", () => {
    const { container } = render(<OrderTrackingTimeline steps={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when shipping and return steps are empty", () => {
    const { container } = render(
      <OrderTrackingTimeline shippingSteps={[]} returnSteps={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders shipping and return steps with correct completion styling", () => {
    const shippingSteps = [{ label: "Shipped", complete: true }];
    const returnSteps = [{ label: "Returned", complete: false }];

    render(
      <OrderTrackingTimeline
        shippingSteps={shippingSteps}
        returnSteps={returnSteps}
      />
    );

    const shippedBullet = screen.getByText("Shipped").previousSibling as HTMLElement;
    expect(shippedBullet).toHaveClass(
      "bg-primary",
      "text-primary-foreground"
    );

    const returnedBullet = screen.getByText("Returned").previousSibling as HTMLElement;
    expect(returnedBullet).toHaveClass(
      "bg-muted",
      "text-muted-foreground"
    );
  });
});
