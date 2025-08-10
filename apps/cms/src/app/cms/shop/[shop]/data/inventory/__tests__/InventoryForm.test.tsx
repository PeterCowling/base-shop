import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import InventoryForm from "../InventoryForm";

jest.mock(
  "@/components/atoms/shadcn",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      Button: React.forwardRef((props: any, ref: any) => (
        <button ref={ref} {...props} />
      )),
      Input: React.forwardRef((props: any, ref: any) => (
        <input ref={ref} {...props} />
      )),
    };
  },
  { virtual: true }
);

describe("InventoryForm", () => {
  const initial = [
    {
      sku: "sku1",
      variantAttributes: { color: "red" },
      quantity: 1,
      lowStockThreshold: 0,
    },
  ];

  it("allows adding and deleting rows", () => {
    render(<InventoryForm shop="shop" initial={initial} />);
    expect(screen.getAllByLabelText(/sku/i)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /add row/i }));
    expect(screen.getAllByLabelText(/sku/i)).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: /delete row/i })[1]);
    expect(screen.getAllByLabelText(/sku/i)).toHaveLength(1);
  });

  it("shows error for invalid variant JSON and prevents submission", async () => {
    const fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
    render(<InventoryForm shop="shop" initial={initial} />);
    fireEvent.change(screen.getByLabelText(/variant attributes/i), {
      target: { value: "{bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(
      await screen.findByText(/position 1/i)
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits structured data", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) });
    (global as any).fetch = fetchMock;
    render(<InventoryForm shop="shop" initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/data/shop/inventory",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            sku: "sku1",
            variantAttributes: { color: "red" },
            quantity: 1,
            lowStockThreshold: 0,
          },
        ]),
      })
    );
  });
});
