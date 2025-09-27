import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MediaLibrary from "../MediaLibrary";
// Mock shadcn primitives to avoid Radix Select validation
jest.mock("../../../atoms/shadcn", () => {
  const Btn = (p: any) => <button {...p} />;
  const Input = (p: any) => <input {...p} />;
  const Wrap = (p: any) => <div>{p.children}</div>;
  const Trigger = (p: any) => <button {...p}>{p.children}</button>;
  const Value = (p: any) => <span>{p.placeholder ?? p.children}</span>;
  const Item = (p: any) => (
    <button role="option" aria-selected={false} onClick={() => p.onSelect?.(p.value)}>
      {p.children}
    </button>
  );
  const Select = ({ value, onValueChange, children }: any) => (
    <div data-value={value} onClickCapture={(e) => {
      const el = e.target as HTMLElement;
      if (el.getAttribute("role") === "option") {
        const val = (el.textContent || "").trim().split(" ")[0];
        onValueChange?.(val);
      }
    }}>{children}</div>
  );
  return { __esModule: true, Button: Btn, Input, Select, SelectTrigger: Trigger, SelectValue: Value, SelectContent: Wrap, SelectItem: Item, Dialog: Wrap, DialogContent: Wrap, DialogTitle: ({ children }: any) => <div>{children}</div>, DialogFooter: Wrap };
});

// Mock useMediaLibrary with parametrized states
const mockHook = jest.fn();
jest.mock("../useMediaLibrary", () => ({ __esModule: true, default: () => mockHook() }));

function makeMedia(n: number): Array<{ url: string; type: "image" | "video"; tags?: string[]; title?: string; altText?: string }> {
  return Array.from({ length: n }, (_, i) => ({ url: `https://cdn/x/${i}.jpg`, type: "image", tags: [i % 2 ? "odd" : "even"], title: `Item ${i}` }));
}

describe("MediaLibrary states and paging", () => {
  it("shows loading and error states", () => {
    mockHook.mockReturnValue({ media: [], loadMedia: jest.fn(), loading: true, error: "" });
    const { rerender } = render(<MediaLibrary onInsertImage={() => {}} onSetSectionBackground={() => {}} selectedIsSection={false} />);
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
    mockHook.mockReturnValue({ media: [], loadMedia: jest.fn(), loading: false, error: "Boom" });
    rerender(<MediaLibrary onInsertImage={() => {}} onSetSectionBackground={() => {}} selectedIsSection={false} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Boom");
  });

  it("paginates media with next/prev and disables Set BG when not a section", () => {
    mockHook.mockReturnValue({ media: makeMedia(30), loadMedia: jest.fn(), loading: false, error: "" });
    render(<MediaLibrary onInsertImage={() => {}} onSetSectionBackground={() => {}} selectedIsSection={false} />);
    // Page 1 of items; next enabled, prev disabled
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText(/Page 2/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Set BG" })[0]).toBeDisabled();
  });
});
