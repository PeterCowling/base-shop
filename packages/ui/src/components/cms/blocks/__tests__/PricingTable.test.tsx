import { render, screen } from "@testing-library/react";
import PricingTable from "../PricingTable";

describe("PricingTable", () => {
  it("renders plan details and CTA", () => {
    render(
      <PricingTable
        plans={[
          {
            title: "Basic",
            price: "$10/mo",
            features: ["Feature A", "Feature B"],
            ctaLabel: "Choose Basic",
            ctaHref: "/basic",
          },
        ]}
      />
    );
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("$10/mo")).toBeInTheDocument();
    expect(screen.getByText("Feature A")).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Choose Basic" });
    expect(cta).toHaveAttribute("href", "/basic");
  });
});
