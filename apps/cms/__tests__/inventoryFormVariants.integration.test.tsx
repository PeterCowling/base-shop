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
      Card: ({ children, ...props }: any) => (
        <div {...props} data-component="card">
          {children}
        </div>
      ),
      CardContent: ({ children, ...props }: any) => (
        <div {...props} data-component="card-content">
          {children}
        </div>
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

jest.mock("@acme/platform-core/types/inventory", () => {
  const { z } = require("zod");
  const inventoryItemSchema = z
    .object({
      sku: z.string(),
      productId: z.string(),
      variantAttributes: z.record(z.string()),
      quantity: z.number().int().min(0),
      lowStockThreshold: z.number().int().min(0).optional(),
    })
    .strict();
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
        variantAttributes: { size: "M", color: "red" },
        quantity: 5,
        lowStockThreshold: 2,
      },
      {
        sku: "sku2",
        productId: "sku2",
        variantAttributes: { size: "L", color: "blue" },
        quantity: 3,
        lowStockThreshold: 1,
      },
    ];
    render(<InventoryForm shop="test" initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: /save inventory/i }));
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

