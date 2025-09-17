import { render, fireEvent, screen, waitFor, within, act } from "@testing-library/react";
import type { ComponentProps } from "react";
import { z } from "zod";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    __esModule: true,
    Card: ({ children, ...props }: ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
    CardContent: ({ children, ...props }: ComponentProps<"div">) => (
      <div {...props}>{children}</div>
    ),
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

jest.mock("@platform-core/types/inventory", () => {
  const inventoryItemSchema = z
    .object({
      sku: z.string(),
      productId: z.string(),
      variantAttributes: z.record(z.string()),
      quantity: z.number().int().min(0),
      lowStockThreshold: z.number().int().min(0).optional(),
      wearCount: z.number().int().min(0).optional(),
      wearAndTearLimit: z.number().int().min(0).optional(),
      maintenanceCycle: z.number().int().min(0).optional(),
    })
    .strict();
  return { inventoryItemSchema };
});

import InventoryForm from "../InventoryForm";
let capturedUpdateItem: (
  index: number,
  field: keyof import("@platform-core/types/inventory").InventoryItem | `variantAttributes.${string}`,
  value: string,
) => void;
jest.mock("../InventoryRow", () => {
  const Actual = jest.requireActual("../InventoryRow").default;
  return (props: any) => {
    capturedUpdateItem = props.updateItem;
    return <Actual {...props} />;
  };
});

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
    fireEvent.click(screen.getByRole("button", { name: /Save inventory/i }));
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

  it("handles row operations and saves normalized data", async () => {
    const onSave = jest.fn();
    render(<InventoryForm shop="test" initial={initial} onSave={onSave} />);
    // initially header + 1 data row
    expect(screen.getAllByRole("row")).toHaveLength(2);
    fireEvent.click(screen.getByText("Add row"));
    // header + 2 data rows
    expect(screen.getAllByRole("row")).toHaveLength(3);
    const newRow = screen.getAllByRole("row")[2];
    fireEvent.change(within(newRow).getAllByRole("textbox")[0], {
      target: { value: "sku2" },
    });
    fireEvent.change(within(newRow).getAllByRole("spinbutton")[0], {
      target: { value: "7" },
    });
    // remove original row
    fireEvent.click(screen.getAllByLabelText("delete-row")[0]);
    expect(screen.getAllByRole("row")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /Save inventory/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith([
      expect.objectContaining({
        sku: "sku2",
        productId: "sku2",
        variantAttributes: {},
        quantity: 7,
      }),
    ]);
  });

  it("shows validation errors for missing SKU and quantity", async () => {
    const onSave = jest.fn();
    render(<InventoryForm shop="test" initial={[]} onSave={onSave} />);
    fireEvent.click(screen.getByText("Add row"));
    fireEvent.click(screen.getByRole("button", { name: /Save inventory/i }));
    const error = await screen.findByText(/SKU is required/i);
    expect(error).toHaveTextContent(/Quantity is required/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("updates wear fields via updateItem", async () => {
    const onSave = jest.fn();
    render(<InventoryForm shop="test" initial={initial} onSave={onSave} />);
    act(() => {
      capturedUpdateItem(0, "wearCount", "3");
      capturedUpdateItem(0, "wearAndTearLimit", "10");
      capturedUpdateItem(0, "maintenanceCycle", "5");
    });
    fireEvent.click(screen.getByRole("button", { name: /Save inventory/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith([
      expect.objectContaining({
        wearCount: 3,
        wearAndTearLimit: 10,
        maintenanceCycle: 5,
      }),
    ]);
  });

  it("handles fetch failure on submit", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Failed" }),
    });
    render(<InventoryForm shop="test" initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: /Save inventory/i }));
    expect(await screen.findByText("Failed")).toBeInTheDocument();
  });

  it("handles fetch failure on import and resets file input", async () => {
    const clickSpy = jest
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(() => {});
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Import failed" }),
    });
    render(<InventoryForm shop="test" initial={initial} />);
    fireEvent.click(screen.getByText("Import JSON/CSV"));
    expect(clickSpy).toHaveBeenCalled();
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["{}"], "data.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText("Import failed")).toBeInTheDocument();
    expect(input.value).toBe("");
    clickSpy.mockRestore();
  });

  it("triggers download on export", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(new Blob(["{}"], { type: "application/json" })),
    });
    const click = jest.fn();
    const originalCreate = document.createElement.bind(document);
    const createElement = jest
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        const el = originalCreate(tag) as HTMLElement;
        if (tag === "a") {
          (el as HTMLAnchorElement).click = click;
        }
        return el;
      });
    jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    render(<InventoryForm shop="test" initial={initial} />);
    fireEvent.click(screen.getByText("Export JSON"));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(click).toHaveBeenCalled();
    createElement.mockRestore();
    (URL.createObjectURL as jest.Mock).mockRestore();
    (URL.revokeObjectURL as jest.Mock).mockRestore();
  });
});

