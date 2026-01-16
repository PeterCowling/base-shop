import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductsTable from "../src/components/cms/ProductsTable.client";
import type { ProductPublication } from "@acme/types";
import { formatCurrency } from "@acme/shared-utils";

const products: ProductPublication[] = [
  {
    id: "1",
    sku: "SKU1",
    title: { en: "Alpha" },
    description: { en: "" },
    price: 1000,
    currency: "USD",
    media: [],
    created_at: "",
    updated_at: "",
    shop: "acme",
    status: "active",
    row_version: 1,
  },
  {
    id: "2",
    sku: "SKU2",
    title: { en: "Beta" },
    description: { en: "" },
    price: 2000,
    currency: "USD",
    media: [],
    created_at: "",
    updated_at: "",
    shop: "acme",
    status: "draft",
    row_version: 1,
  },
];

describe("ProductsTable", () => {
  it("renders columns, rows and invokes actions", async () => {
    const user = userEvent.setup();
    const onDuplicate = jest.fn();
    const onDelete = jest.fn();
    const sellability = {
      "1": { state: "sellable" as const, issues: [], stock: 5 },
      "2": { state: "needs_attention" as const, issues: ["needs_stock"], stock: 0 },
    };

    render(
      <ProductsTable
        shop="acme"
        rows={products}
        isAdmin
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        sellability={sellability}
      />
    );

    // headers
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("SKU")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Sellability")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    // row rendering
    expect(screen.getByRole("link", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByText("SKU1")).toBeInTheDocument();
    expect(
      screen.getByText(formatCurrency(products[0].price, products[0].currency))
    ).toBeInTheDocument();
    expect(screen.getAllByText("active", { selector: "td" })[0]).toBeInTheDocument();
    expect(screen.getByText("Sellable")).toBeInTheDocument();
    expect(screen.getByText("Needs stock")).toBeInTheDocument();

    const duplicateBtn = screen.getAllByRole("button", { name: "Duplicate" })[0];
    await user.click(duplicateBtn);
    expect(onDuplicate).toHaveBeenCalledWith("acme", products[0].id);

    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    const deleteBtn = screen.getAllByRole("button", { name: "Delete" })[0];
    await user.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith("acme", products[0].id);
    confirmSpy.mockRestore();
  });

  it("filters rows by search and status", async () => {
    const user = userEvent.setup();
    render(
      <ProductsTable
        shop="acme"
        rows={products}
        isAdmin={false}
        onDuplicate={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    const search = screen.getByPlaceholderText("Search titles or SKU…");
    await user.type(search, "SKU2");

    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();

    await user.clear(search);
    const statusSelect = screen.getByRole("combobox");
    await user.selectOptions(statusSelect, "draft");

    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });
});
