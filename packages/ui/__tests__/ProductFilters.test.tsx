import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProductFilters from "../src/components/cms/ProductFilters";
import { type ProductStatus,useProductFilters } from "../src/hooks/useProductFilters";

const products: Array<{
  id: string;
  title: string;
  sku: string;
  status: ProductStatus;
}> = [
  { id: "1", title: "Red Shoe", sku: "red", status: "active" },
  { id: "2", title: "Blue Hat", sku: "blue", status: "draft" },
];

function Wrapper() {
  const { search, status, setSearch, setStatus, filteredRows } =
    useProductFilters(products);
  return (
    <div>
      <ProductFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />
      <p data-cy="search">{search}</p>
      <p data-cy="status">{status}</p>
      <p data-cy="count">{filteredRows.length}</p>
      <button onClick={() => {setSearch(""); setStatus("all");}}>Clear</button>
    </div>
  );
}

describe("ProductFilters", () => {
  it("updates and clears query state", async () => {
    render(<Wrapper />);
    expect(screen.getByTestId("search").textContent).toBe("");
    expect(screen.getByTestId("status").textContent).toBe("all");
    expect(screen.getByTestId("count").textContent).toBe("2");

    await userEvent.type(
      screen.getByPlaceholderText("Search titles or SKU…"),
      "blue",
    );
    await userEvent.selectOptions(screen.getByRole("combobox"), "draft");

    expect(screen.getByTestId("search").textContent).toBe("blue");
    expect(screen.getByTestId("status").textContent).toBe("draft");
    expect(screen.getByTestId("count").textContent).toBe("1");

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByTestId("search").textContent).toBe("");
    expect(screen.getByTestId("status").textContent).toBe("all");
    expect(screen.getByTestId("count").textContent).toBe("2");
  });
});
