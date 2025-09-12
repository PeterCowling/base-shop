import { render, screen } from "@testing-library/react";
import { CheckoutStepper } from "./CheckoutStepper";

describe("CheckoutStepper", () => {
  const steps = ["Cart", "Shipping", "Payment"];

  it("renders and updates step styles as currentStep changes", () => {
    const { rerender } = render(<CheckoutStepper steps={steps} currentStep={0} />);

    const list = screen.getByRole("list");
    expect(list).toHaveClass("flex items-center gap-4 text-sm");
    screen.getAllByRole("listitem").forEach((item) =>
      expect(item).toHaveClass("flex flex-1 items-center gap-2")
    );

    expect(screen.getByText("Cart").previousSibling).toHaveTextContent("1");

    rerender(<CheckoutStepper steps={steps} currentStep={1} />);

    const cartBullet = screen.getByText("Cart").previousSibling as HTMLElement;
    expect(cartBullet.querySelector("svg")).toBeInTheDocument();

    const shippingLabel = screen.getByText("Shipping");
    const shippingBullet = shippingLabel.previousSibling as HTMLElement;
    expect(shippingBullet).toHaveClass("border-primary");
    expect(shippingLabel).toHaveClass("font-medium");

    rerender(<CheckoutStepper steps={steps} currentStep={2} />);
    expect(shippingBullet.querySelector("svg")).toBeInTheDocument();

    const paymentLabel = screen.getByText("Payment");
    const paymentBullet = paymentLabel.previousSibling as HTMLElement;
    expect(paymentBullet).toHaveClass("border-primary");
    expect(paymentLabel).toHaveClass("font-medium");
  });
});
