import { render, fireEvent, screen, waitFor } from "@testing-library/react";

jest.mock(
  "@/components/atoms/shadcn",
  () => {
    const React = require("react");
    return {
      __esModule: true,
      Button: ({ children, ...props }: any) => (
        <button {...props}>{children}</button>
      ),
      Input: ({ ...props }: any) => <input {...props} />,
      Table: ({ children }: any) => <table>{children}</table>,
      TableBody: ({ children }: any) => <tbody>{children}</tbody>,
      TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
      TableHead: ({ children }: any) => <th>{children}</th>,
      TableHeader: ({ children }: any) => <thead>{children}</thead>,
      TableRow: ({ children }: any) => <tr>{children}</tr>,
    };
  },
  { virtual: true }
);

jest.mock("@types", () => {
  const { z } = require("zod");
  const inventoryItemSchema = z.object({
    sku: z.string(),
    productId: z.string(),
    variant: z.object({
      size: z.string(),
      color: z.string().optional(),
    }),
    quantity: z.number().min(1),
    lowStockThreshold: z.number().optional(),
  });
  return { inventoryItemSchema };
});

import InventoryForm from "../InventoryForm";

describe("InventoryForm", () => {
  const initial = [
    {
      sku: "sku1",
      productId: "sku1",
      variant: { size: "M", color: "red" },
      quantity: 5,
      lowStockThreshold: 2,
    },
  ];

  beforeEach(() => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
  });

  it("adds and deletes rows", () => {
    render(<InventoryForm shop="test" initial={initial} />);
    // header row + 1 data row
    expect(screen.getAllByRole("row")).toHaveLength(2);
    fireEvent.click(screen.getByText("Add row"));
    expect(screen.getAllByRole("row")).toHaveLength(3);
    fireEvent.click(screen.getAllByText("Delete")[1]);
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("posts structured data on save", async () => {
    render(<InventoryForm shop="test" initial={initial} />);
    fireEvent.change(screen.getByDisplayValue("sku1"), {
      target: { value: "sku2" },
    });
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/data/test/inventory",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            sku: "sku2",
            productId: "sku2",
            variant: { size: "M", color: "red" },
            quantity: 5,
            lowStockThreshold: 2,
          },
        ]),
      })
    );
  });

  it("shows validation errors", async () => {
    render(<InventoryForm shop="test" initial={initial} />);
    fireEvent.change(screen.getByDisplayValue("5"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByText("Save"));
    await screen.findByText(/greater than or equal to 1/i);
    expect(fetch).not.toHaveBeenCalled();
  });
});

