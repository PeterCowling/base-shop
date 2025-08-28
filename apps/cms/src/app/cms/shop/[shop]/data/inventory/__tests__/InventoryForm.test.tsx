import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { z } from "zod";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    __esModule: true,
    Button: ({ children, ...props }: ComponentProps<"button">) => (
      <button {...props}>{children}</button>
    ),
    Input: (props: ComponentProps<"input">) => <input {...props} />,
    Table: ({ children }: ComponentProps<"table">) => <table>{children}</table>,
    TableBody: ({ children }: ComponentProps<"tbody">) => <tbody>{children}</tbody>,
    TableCell: ({ children, ...props }: ComponentProps<"td">) => (
      <td {...props}>{children}</td>
    ),
    TableHead: ({ children }: ComponentProps<"th">) => <th>{children}</th>,
    TableHeader: ({ children }: ComponentProps<"thead">) => <thead>{children}</thead>,
    TableRow: ({ children }: ComponentProps<"tr">) => <tr>{children}</tr>,
  }),
  { virtual: true }
);

jest.mock("@acme/types", () => {
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

import InventoryForm from "../InventoryForm";

describe("InventoryForm", () => {
  const initial = [
    {
      sku: "sku1",
      productId: "sku1",
      variantAttributes: { size: "M", color: "red" },
      quantity: 5,
      lowStockThreshold: 2,
    },
  ];

  beforeEach(() => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }) as unknown as typeof fetch;
  });

  it("adds and deletes rows", () => {
    render(<InventoryForm shop="test" initial={initial} />);
    // header row + 1 data row
    expect(screen.getAllByRole("row")).toHaveLength(2);
    fireEvent.click(screen.getByText("Add row"));
    expect(screen.getAllByRole("row")).toHaveLength(3);
    fireEvent.click(screen.getAllByLabelText("delete-row")[1]);
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });

  it("adds attribute columns and persists values", async () => {
    window.prompt = jest.fn().mockReturnValue("material") as unknown as typeof window.prompt;
    render(<InventoryForm shop="test" initial={initial} />);
    fireEvent.click(screen.getByText("Add attribute"));
    expect(screen.getByText("material")).toBeInTheDocument();
    fireEvent.change(screen.getAllByRole("textbox")[3], {
      target: { value: "cotton" },
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
            sku: "sku1",
            productId: "sku1",
            variantAttributes: { size: "M", color: "red", material: "cotton" },
            quantity: 5,
            lowStockThreshold: 2,
          },
        ]),
      }),
    );
  });

  it("posts structured data on save", async () => {
    render(<InventoryForm shop="test" initial={initial} />);
    fireEvent.change(screen.getByDisplayValue("sku1"), {
      target: { value: "sku2" },
    });
    fireEvent.change(screen.getByDisplayValue("red"), {
      target: { value: "blue" },
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
            variantAttributes: { size: "M", color: "blue" },
            quantity: 5,
            lowStockThreshold: 2,
          },
        ]),
      }),
    );
  });

  it("shows validation errors", async () => {
    render(<InventoryForm shop="test" initial={initial} />);
    fireEvent.change(screen.getByDisplayValue("5"), {
      target: { value: "-1" },
    });
    fireEvent.submit(screen.getByText("Save").closest("form")!);
    await screen.findByText(/greater than or equal to 0/i);
    expect(fetch).not.toHaveBeenCalled();
  });
});

