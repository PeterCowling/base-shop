import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import LibraryPaletteItem from "../LibraryPaletteItem";

jest.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({ attributes: {}, listeners: {}, setNodeRef: () => {}, transform: undefined, isDragging: false }),
}));

// Avoid Next/Image warnings in DOM
jest.mock("next/image", () => ({ __esModule: true, default: (p: any) => <img alt={p.alt} src={p.src} /> }));

function mockFileReader(result: string) {
  const loadHandlers: Array<() => void> = [];
  class FR {
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;
    readAsDataURL() {
      setTimeout(() => {
        (this as any).result = result;
        this.onload?.();
      }, 0);
    }
  }
  // @ts-expect-error override
  global.FileReader = FR as any;
}

describe("LibraryPaletteItem", () => {
  const baseItem = { id: "1", label: "Hero", createdAt: 0, tags: ["a"] } as any;

  it("enters edit mode, adds/removes tag, saves and cancels", () => {
    const onUpdate = jest.fn();
    render(<LibraryPaletteItem item={baseItem} onDelete={jest.fn()} onToggleShare={jest.fn()} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    // add a tag via input + Enter
    fireEvent.change(screen.getByLabelText("Add tag"), { target: { value: "new" } });
    fireEvent.keyDown(screen.getByLabelText("Add tag"), { key: "," });
    // remove existing tag
    fireEvent.click(screen.getByRole("button", { name: "Remove a" }));
    // save
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onUpdate).toHaveBeenCalledWith({ label: "Hero", tags: ["new"] });

    // re-enter edit and cancel resets
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Hero")).toBeInTheDocument();
  });

  it("toggles share and delete actions", () => {
    const onToggleShare = jest.fn();
    const onDelete = jest.fn();
    render(<LibraryPaletteItem item={baseItem} onDelete={onDelete} onToggleShare={onToggleShare} onUpdate={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(onToggleShare).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete from My Library" }));
    expect(onDelete).toHaveBeenCalled();
  });

  it("uploads thumbnail via network when shop provided; falls back to FileReader when no shop", async () => {
    const onUpdate = jest.fn();
    // Network path
    (global.fetch as any) = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ url: "/u.png" }) });
    const { rerender } = render(<LibraryPaletteItem item={baseItem} onDelete={jest.fn()} onToggleShare={jest.fn()} onUpdate={onUpdate} shop="s1" />);
    fireEvent.click(screen.getByRole("button", { name: "Upload thumbnail" }));
    const file = new File(["x"], "x.png", { type: "image/png" });
    // Fire change on the hidden input by dispatching directly
    const hidden = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(hidden, { target: { files: [file] } });
    // onUpdate called with network url
    expect(await Promise.resolve(onUpdate)).toBeDefined();

    // Fallback path – no shop, use FileReader
    mockFileReader("data:image/png;base64,abc");
    onUpdate.mockClear();
    rerender(<LibraryPaletteItem item={baseItem} onDelete={jest.fn()} onToggleShare={jest.fn()} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByRole("button", { name: "Upload thumbnail" }));
    const hidden2 = document.querySelector("input[type=file]") as HTMLInputElement;
    fireEvent.change(hidden2, { target: { files: [file] } });
    // allow FileReader microtask to run
    await new Promise((r) => setTimeout(r, 0));
    expect(onUpdate).toHaveBeenCalledWith({ thumbnail: "data:image/png;base64,abc" });
  });
});
