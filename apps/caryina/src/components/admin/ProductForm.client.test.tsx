import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { ProductPublication } from "@acme/types";

import { ProductForm } from "./ProductForm.client";

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const EXISTING_PRODUCT: ProductPublication = {
  id: "01JTEST000000000000000001",
  sku: "caryina-silver",
  title: { en: "Silver Charm", de: "Silver Charm", it: "Silver Charm" },
  description: { en: "A silver charm", de: "A silver charm", it: "A silver charm" },
  price: 4500,
  currency: "EUR",
  media: [],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  shop: "caryina",
  status: "active",
  row_version: 1,
  forSale: true,
  forRental: false,
};

describe("ProductForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("blocks create submit when SKU is missing", () => {
    render(<ProductForm />);

    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "Test product" },
    });
    fireEvent.change(screen.getByLabelText(/Price/i), {
      target: { value: "45.00" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: "Create product" }).closest("form") as HTMLFormElement,
    );

    expect(screen.getByText("SKU is required.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits create payload and redirects on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    render(<ProductForm />);

    fireEvent.change(screen.getByLabelText(/^SKU/i), {
      target: { value: "new-sku" },
    });
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "New Product" },
    });
    fireEvent.change(screen.getByLabelText(/Price/i), {
      target: { value: "89.00" },
    });
    fireEvent.change(screen.getByLabelText(/Initial stock/i), {
      target: { value: "12" },
    });
    fireEvent.change(screen.getByLabelText(/Status/i), {
      target: { value: "active" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create product" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/admin/api/products",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            sku: "new-sku",
            title: "New Product",
            description: "",
            price: 8900,
            status: "active",
            forSale: true,
            media: [],
            initialStock: 12,
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/admin/products");
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("blocks active create submit when initial stock is zero", () => {
    render(<ProductForm />);

    fireEvent.change(screen.getByLabelText(/^SKU/i), {
      target: { value: "new-sku" },
    });
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: "New Product" },
    });
    fireEvent.change(screen.getByLabelText(/Price/i), {
      target: { value: "89.00" },
    });
    fireEvent.change(screen.getByLabelText(/Status/i), {
      target: { value: "active" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create product" }));

    expect(
      screen.getByText("Active products need stock greater than 0 before publish."),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("maps active_requires_stock to actionable copy", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "active_requires_stock" }),
    });

    render(<ProductForm product={{ ...EXISTING_PRODUCT, status: "draft" }} />);

    fireEvent.change(screen.getByLabelText(/Status/i), {
      target: { value: "active" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(
        screen.getByText("Active products need stock greater than 0 before publish."),
      ).toBeInTheDocument();
    });
  });

  it("deletes product in edit mode when confirmed", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    render(<ProductForm product={EXISTING_PRODUCT} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/admin/api/products/${EXISTING_PRODUCT.id}`,
        { method: "DELETE" },
      );
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/admin/products");
      expect(refreshMock).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
