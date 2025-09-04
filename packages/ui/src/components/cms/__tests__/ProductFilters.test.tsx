import { render, fireEvent } from "@testing-library/react";
import ProductFilters, { statuses } from "../ProductFilters";

describe("ProductFilters", () => {
  it("renders all statuses", () => {
    const { getByRole } = render(
      <ProductFilters
        search=""
        status="all"
        onSearchChange={jest.fn()}
        onStatusChange={jest.fn()}
      />
    );

    statuses.forEach((s) => {
      const label = s === "all" ? "All statuses" : s;
      expect(getByRole("option", { name: label })).toBeInTheDocument();
    });
  });

  it("calls callbacks with correct values", () => {
    const onSearchChange = jest.fn();
    const onStatusChange = jest.fn();
    const { getByPlaceholderText, getByRole } = render(
      <ProductFilters
        search=""
        status="all"
        onSearchChange={onSearchChange}
        onStatusChange={onStatusChange}
      />
    );

    fireEvent.change(getByPlaceholderText("Search titles or SKU…"), {
      target: { value: "hello" },
    });
    expect(onSearchChange).toHaveBeenCalledWith("hello");

    fireEvent.change(getByRole("combobox"), { target: { value: "draft" } });
    expect(onStatusChange).toHaveBeenCalledWith("draft");
  });
});

