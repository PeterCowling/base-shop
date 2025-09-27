/* i18n-exempt file -- literals used for test feature labels */
import { render, screen } from "@testing-library/react";
import { ProductFeatures } from "../ProductFeatures";

describe("ProductFeatures", () => {
  it("renders features with icons and applies className", () => {
    const features = ["Waterproof", "Eco-friendly"];
    const { container } = render(
      <ProductFeatures features={features} className="custom" />
    );

    features.forEach((f) => {
      expect(screen.getByText(f)).toBeInTheDocument();
    });

    const list = container.firstChild as HTMLElement;
    expect(list).toHaveClass("space-y-2", "custom");
    expect(list.querySelectorAll("svg")).toHaveLength(features.length);
  });
});
