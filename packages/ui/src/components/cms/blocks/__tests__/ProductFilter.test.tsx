import { fireEvent,render, screen } from "@testing-library/react";

import { useProductFilters } from "../../../../hooks/useProductFilters";
import ProductFilter from "../ProductFilter";

const pushMock = jest.fn();
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => searchParams,
}));

jest.mock("../../../../hooks/useProductFilters", () => ({
  useProductFilters: jest.fn(),
}));

describe("ProductFilter", () => {
  const products = [
    { id: "red-s", title: "Red S", sizes: ["S"], price: 10 },
    { id: "red-l", title: "Red L", sizes: ["L"], price: 20 },
    { id: "blue-l", title: "Blue L", sizes: ["L"], price: 30 },
    { id: "green", title: "Green", price: 5 },
    { id: "black-l", title: "Black L", sizes: ["L"] },
  ];

  beforeEach(() => {
    pushMock.mockReset();
    searchParams = new URLSearchParams();
    (useProductFilters as jest.Mock).mockReturnValue({ filteredRows: products });
  });

  it("filters by size, price and color", () => {
    render(<ProductFilter />);

    expect(screen.getByText("5 products")).toBeInTheDocument();

    const [sizeSelect, colorSelect] = screen.getAllByRole("combobox");
    const [minInput, maxInput] = screen.getAllByRole("spinbutton") as HTMLInputElement[];
    const defaultMin = minInput.value;
    const defaultMax = maxInput.value;

    fireEvent.change(sizeSelect, { target: { value: "L" } });
    expect(screen.getByText("3 products")).toBeInTheDocument();

    fireEvent.change(maxInput, { target: { value: "15" } });
    expect(screen.getByText("1 products")).toBeInTheDocument();

    fireEvent.change(colorSelect, { target: { value: "red" } });
    expect(screen.getByText("0 products")).toBeInTheDocument();

    fireEvent.change(sizeSelect, { target: { value: "" } });
    fireEvent.change(colorSelect, { target: { value: "" } });
    fireEvent.change(minInput, { target: { value: defaultMin } });
    fireEvent.change(maxInput, { target: { value: defaultMax } });
    expect(screen.getByText("5 products")).toBeInTheDocument();
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

