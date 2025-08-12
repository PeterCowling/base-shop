import { render, screen } from "@testing-library/react";
import { SearchBar } from "../SearchBar";

describe("SearchBar", () => {
  it("applies accessible label", () => {
    render(<SearchBar suggestions={[]} label="Search products" />);
    const input = screen.getByLabelText("Search products");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-label", "Search products");
    const label = screen.getByText("Search products");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveClass("sr-only");
  });
});
