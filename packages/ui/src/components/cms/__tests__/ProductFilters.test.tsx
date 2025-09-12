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

  it("reflects provided search and status", () => {
    const { getByPlaceholderText, getByRole } = render(
      <ProductFilters
        search="shoe"
        status="draft"
        onSearchChange={jest.fn()}
        onStatusChange={jest.fn()}
      />
    );

    expect(getByPlaceholderText("Search titles or SKU…")).toHaveValue("shoe");
    expect(getByRole("combobox")).toHaveValue("draft");
  });

  it('displays "All statuses" when status is all', () => {
    const { getByRole } = render(
      <ProductFilters
        search=""
        status="all"
        onSearchChange={jest.fn()}
        onStatusChange={jest.fn()}
      />
    );

    expect(getByRole("combobox")).toHaveDisplayValue("All statuses");
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

