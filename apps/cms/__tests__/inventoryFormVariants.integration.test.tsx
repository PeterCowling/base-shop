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

import InventoryForm from "../src/app/cms/shop/[shop]/data/inventory/InventoryForm";

describe("InventoryForm integration", () => {
  beforeEach(() => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
  });

  it("submits multiple rows with variant attributes", async () => {
    const initial = [
      {
        sku: "sku1",
        productId: "sku1",
        variant: { size: "M", color: "red" },
        quantity: 5,
        lowStockThreshold: 2,
      },
      {
        sku: "sku2",
        productId: "sku2",
        variant: { size: "L", color: "blue" },
        quantity: 3,
        lowStockThreshold: 1,
      },
    ];
    render(<InventoryForm shop="test" initial={initial} />);
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith(
      "/api/data/test/inventory",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initial),
      })
    );
  });
});

