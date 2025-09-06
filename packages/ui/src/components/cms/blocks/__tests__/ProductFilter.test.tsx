import { render, screen, fireEvent } from "@testing-library/react";
import ProductFilter from "../ProductFilter";
import { useProductFilters } from "../../../../hooks/useProductFilters";

jest.mock("../../../../hooks/useProductFilters", () => ({
  useProductFilters: jest.fn(),
}));

describe("ProductFilter", () => {
  const products = [
    { id: "red-s", title: "Red S", sizes: ["S"], price: 10 },
    { id: "red-l", title: "Red L", sizes: ["L"], price: 20 },
    { id: "blue-l", title: "Blue L", sizes: ["L"], price: 30 },
  ];

  beforeEach(() => {
    (useProductFilters as jest.Mock).mockReturnValue({ filteredRows: products });
  });

  it("filters by size, color and price", () => {
    render(<ProductFilter />);

    expect(screen.getByText("3 products")).toBeInTheDocument();

    const [sizeSelect, colorSelect] = screen.getAllByRole("combobox");
    const [, maxInput] = screen.getAllByRole("spinbutton");

    fireEvent.change(sizeSelect, { target: { value: "L" } });
    expect(screen.getByText("2 products")).toBeInTheDocument();

    fireEvent.change(colorSelect, { target: { value: "red" } });
    expect(screen.getByText("1 products")).toBeInTheDocument();

    fireEvent.change(maxInput, { target: { value: "15" } });
    expect(screen.getByText("0 products")).toBeInTheDocument();
  });

  it("hides filter sections when disabled", () => {
    render(
      <ProductFilter showSize={false} showColor={false} showPrice={false} />,
    );
    expect(screen.queryByText("Size")).not.toBeInTheDocument();
    expect(screen.queryByText("Color")).not.toBeInTheDocument();
    expect(screen.queryByText("Price")).not.toBeInTheDocument();
  });
});

