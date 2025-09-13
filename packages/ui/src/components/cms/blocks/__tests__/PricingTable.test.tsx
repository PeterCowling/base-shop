import { render, screen, within } from "@testing-library/react";
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

  it("renders multiple plans and highlights the recommended one", () => {
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
          {
            title: "Pro",
            price: "$20/mo",
            features: ["Feature A", "Feature C"],
            ctaLabel: "Choose Pro",
            ctaHref: "/pro",
            featured: true,
          },
          {
            title: "Enterprise",
            price: "$30/mo",
            features: ["Feature A", "Feature B", "Feature C"],
            ctaLabel: "Choose Enterprise",
            ctaHref: "/enterprise",
          },
        ]}
      />
    );

    const basicCard = screen.getByText("Basic").closest("div")!;
    expect(within(basicCard).getByText("Feature B")).toBeInTheDocument();
    expect(within(basicCard).queryByText("Feature C")).toBeNull();
    expect(basicCard).not.toHaveClass("border-primary");

    const proCard = screen.getByText("Pro").closest("div")!;
    expect(within(proCard).getByText("Feature C")).toBeInTheDocument();
    expect(within(proCard).queryByText("Feature B")).toBeNull();
    expect(proCard).toHaveClass("border-primary");

    const enterpriseCard = screen.getByText("Enterprise").closest("div")!;
    expect(within(enterpriseCard).getByText("Feature B")).toBeInTheDocument();
    expect(within(enterpriseCard).getByText("Feature C")).toBeInTheDocument();
    expect(enterpriseCard).not.toHaveClass("border-primary");
  });
});
