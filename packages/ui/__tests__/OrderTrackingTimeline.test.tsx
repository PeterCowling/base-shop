import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OrderTrackingTimeline } from "../src/components/organisms/OrderTrackingTimeline";

describe("OrderTrackingTimeline", () => {
  it("returns null when trackingEnabled is false", () => {
    const { container } = render(<OrderTrackingTimeline trackingEnabled={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("merges shipping and return steps when only those are provided", () => {
    const shippingSteps = [{ label: "Shipped" }];
    const returnSteps = [{ label: "Returned" }];
    render(
      <OrderTrackingTimeline shippingSteps={shippingSteps} returnSteps={returnSteps} />
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Shipped");
    expect(items[1]).toHaveTextContent("Returned");
  });

  it("renders a check icon only for completed steps", () => {
    const steps = [
      { label: "Shipped", complete: true },
      { label: "Returned", complete: false },
    ];
    render(<OrderTrackingTimeline steps={steps} />);
    const shippedBullet = screen.getByText("Shipped").previousSibling as HTMLElement;
    expect(shippedBullet.querySelector("svg")).toBeInTheDocument();
    const returnedBullet = screen.getByText("Returned").previousSibling as HTMLElement;
    expect(returnedBullet.querySelector("svg")).toBeNull();
  });
});
