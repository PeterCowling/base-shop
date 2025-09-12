import { render, screen } from "@testing-library/react";
import { ProductFeatures } from "./ProductFeatures";

describe("ProductFeatures", () => {
  it("renders provided features with icons", () => {
    const features = ["Waterproof", "Eco-friendly"];
    const { container } = render(<ProductFeatures features={features} className="extra" />);

    features.forEach((f) => {
      expect(screen.getByText(f)).toBeInTheDocument();
    });

    const list = container.querySelector("ul");
    expect(list).toHaveClass("space-y-2", "extra");
    expect(list?.querySelectorAll("li")).toHaveLength(features.length);
    expect(list?.querySelectorAll("svg")).toHaveLength(features.length);
  });

  it("renders an empty list when no features provided", () => {
    const { container } = render(<ProductFeatures features={[]} />);
    const list = container.querySelector("ul");
    expect(list).toBeInTheDocument();
    expect(list?.querySelectorAll("li")).toHaveLength(0);
  });
});

