import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { InventoryEditor } from "./InventoryEditor.client";

const INVENTORY_ITEM = {
  sku: "caryina-silver",
  productId: "01JTEST000000000000000001",
  quantity: 5,
  variantAttributes: { color: "silver" },
  lowStockThreshold: 1,
};

describe("InventoryEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("submits updated quantity and shows saved state", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    render(
      <InventoryEditor
        productSku="caryina-silver"
        inventoryItems={[INVENTORY_ITEM]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Quantity"), {
      target: { value: "7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update stock" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/admin/api/inventory/caryina-silver",
        expect.objectContaining({ method: "PATCH" }),
      );
    });

    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("shows operator-friendly message when API returns not_found", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "not_found" }),
    });

    render(
      <InventoryEditor
        productSku="caryina-silver"
        inventoryItems={[INVENTORY_ITEM]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Update stock" }));

    await waitFor(() => {
      expect(
        screen.getByText("No matching product was found for this SKU."),
      ).toBeInTheDocument();
    });
  });

  it("renders accurate empty-state helper text", () => {
    render(<InventoryEditor productSku="new-sku" inventoryItems={[]} />);

    expect(
      screen.getByText(
        "No inventory record found for this SKU yet. Saving will create one if the product exists.",
      ),
    ).toBeInTheDocument();
  });
});
