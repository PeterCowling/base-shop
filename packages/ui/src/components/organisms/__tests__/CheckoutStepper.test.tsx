/* i18n-exempt file -- tests use literal copy for assertions */
import { render, screen } from "@testing-library/react";

import { CheckoutStepper } from "../CheckoutStepper";

describe("CheckoutStepper", () => {
  const steps = ["Cart", "Shipping", "Payment"];

  it("updates step visuals when currentStep changes", () => {
    const { rerender } = render(
      <CheckoutStepper steps={steps} currentStep={0} />
    );

    expect(screen.getByText("Cart").previousSibling).toHaveTextContent("1");

    rerender(<CheckoutStepper steps={steps} currentStep={1} />);

    const firstBullet = screen.getByText("Cart").previousSibling as HTMLElement;
    expect(firstBullet.querySelector("svg")).toBeInTheDocument();

    const secondLabel = screen.getByText("Shipping");
    const secondBullet = secondLabel.previousSibling as HTMLElement;
    expect(secondBullet).toHaveTextContent("2");
    expect(secondBullet).toHaveClass("border-primary");
    expect(secondLabel).toHaveClass("font-medium");
  });
});
