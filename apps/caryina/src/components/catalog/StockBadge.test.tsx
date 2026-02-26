import { render, screen } from "@testing-library/react";

import { StockBadge } from "@/components/catalog/StockBadge";

describe("StockBadge", () => {
  // TC-01: stock states with per-SKU thresholds

  it("renders In stock when stock exceeds threshold (default threshold=2, stock=5)", () => {
    render(<StockBadge stock={5} lowStockThreshold={2} />);
    expect(screen.getByText("In stock")).toBeInTheDocument();
  });

  it("renders Low stock when stock equals threshold (rose-splash: stock=2, threshold=2)", () => {
    render(<StockBadge stock={2} lowStockThreshold={2} />);
    expect(screen.getByText("Low stock (2 left)")).toBeInTheDocument();
  });

  it("renders In stock for silver SKU when stock=2 exceeds threshold=1", () => {
    // silver lowStockThreshold=1, so stock=2 > 1 → In stock (not Low stock)
    render(<StockBadge stock={2} lowStockThreshold={1} />);
    expect(screen.getByText("In stock")).toBeInTheDocument();
  });

  it("renders Low stock (1 left) for peach/silver SKU at threshold (stock=1, threshold=1)", () => {
    render(<StockBadge stock={1} lowStockThreshold={1} />);
    expect(screen.getByText("Low stock (1 left)")).toBeInTheDocument();
  });

  it("renders Out of stock when stock is 0", () => {
    render(<StockBadge stock={0} />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });

  it("uses default threshold of 2 when lowStockThreshold is not provided (stock=2 → Low stock)", () => {
    render(<StockBadge stock={2} />);
    expect(screen.getByText("Low stock (2 left)")).toBeInTheDocument();
  });

  it("uses default threshold of 2 when lowStockThreshold is not provided (stock=3 → In stock)", () => {
    render(<StockBadge stock={3} />);
    expect(screen.getByText("In stock")).toBeInTheDocument();
  });

  // TC-02: out-of-stock badge renders disabled state indicator
  it("renders the out-of-stock text when stock is 0 (badge used as CTA-disabled signal)", () => {
    render(<StockBadge stock={0} />);
    const badge = screen.getByText("Out of stock");
    expect(badge).toBeInTheDocument();
  });
});
