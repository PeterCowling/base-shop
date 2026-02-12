import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { SustainabilityBadgeCluster } from "../SustainabilityBadgeCluster";

describe("SustainabilityBadgeCluster", () => {
  it("renders badges with provided variant values", async () => {
    const { container } = render(
      <SustainabilityBadgeCluster
        badges={[
          { label: "Eco", variant: "default" },
          { label: "Discount", variant: "sale" },
        ]}
      />
    );

    const eco = screen.getByText("Eco");
    expect(eco).toHaveClass("text-fg");

    expect(eco.parentElement).toHaveClass("bg-muted");

    const discount = screen.getByText("Discount");
    expect(discount).toHaveClass("text-danger-foreground");
    expect(discount.parentElement).toHaveClass("bg-danger");
  });

  it("uses 'new' variant when none is provided", () => {
    render(
      <SustainabilityBadgeCluster badges={[{ label: "Recycled" }]} />
    );

    const badge = screen.getByText("Recycled");
    expect(badge).toHaveClass("text-success-fg");
    expect(badge.parentElement).toHaveClass("bg-success");
  });
});
