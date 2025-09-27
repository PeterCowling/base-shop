import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MediaLibrary from "../MediaLibrary";

// Simplify shadcn primitives to avoid Radix Select constraints in unit tests
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
    <div data-select-value={value} onClickCapture={(e) => {
      const target = e.target as HTMLElement;
      if (target && target.getAttribute("role") === "option") {
        const val = (target.textContent || "").trim().split(" ")[0];
        onValueChange?.(val);
      }
    }}>{children}</div>
  );
  return {
    __esModule: true,
    Button: Btn,
    Input,
    Select,
    SelectTrigger: Trigger,
    SelectValue: Value,
    SelectContent: Wrap,
    SelectItem: Item,
    Dialog: Wrap,
    DialogContent: Wrap,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogFooter: Wrap,
  };
});

jest.mock("../useMediaLibrary", () => ({ __esModule: true, default: () => ({
  media: [
    { url: "https://cdn/x/a.jpg", type: "image", tags: ["hero", "promo"], title: "Banner A", altText: "Alt A" },
    { url: "https://cdn/x/b.mp4", type: "video", tags: ["promo"], title: "Video B" },
    { url: "https://cdn/x/c.jpg", type: "image", tags: [], title: "Card C" },
  ],
  loadMedia: jest.fn(),
  loading: false,
  error: "",
}) }));

describe("MediaLibrary", () => {
  it("filters by type, tag, and query; supports insert and background actions", () => {
    const onInsertImage = jest.fn();
    const onSetSectionBackground = jest.fn();
    render(<MediaLibrary onInsertImage={onInsertImage} onSetSectionBackground={onSetSectionBackground} selectedIsSection />);

    // By default shows all three items; click Insert on first image
    fireEvent.click(screen.getAllByRole("button", { name: "Insert" })[0]);
    expect(onInsertImage).toHaveBeenCalledWith("https://cdn/x/a.jpg");

    // Open Edit… for image
    fireEvent.click(screen.getAllByRole("button", { name: "Edit…" })[0]);
    // Change alt text and choose aspect
    const alt = screen.getByPlaceholderText("Describe the image for accessibility");
    fireEvent.change(alt, { target: { value: "Hero alt" } });
    fireEvent.click(screen.getByText("Aspect (optional)"));
    fireEvent.click(screen.getByText("16:9"));
    // Click Insert in dialog → dispatches CustomEvent
    fireEvent.click(screen.getAllByRole("button", { name: "Insert" }).slice(-1)[0]);

    // Set BG button enabled and calls handler
    fireEvent.click(screen.getAllByRole("button", { name: "Set BG" })[0]);
    expect(onSetSectionBackground).toHaveBeenCalledWith("https://cdn/x/a.jpg");

    // Filter to images only
    fireEvent.click(screen.getByLabelText("Filter media type"));
    fireEvent.click(screen.getByText("image"));
    // Now only images are paginated; type a search that matches tags
    fireEvent.change(screen.getByPlaceholderText("Search filename, title or tag"), { target: { value: "hero" } });
    // Should show at least one result label (pagination footer shows range)
    expect(screen.getByText(/of/)).toBeInTheDocument();

    // Filter by tag using the second select
    fireEvent.click(screen.getByLabelText("Filter by tag"));
    fireEvent.click(screen.getByText(/hero \(1\)/));

    // Pagination controls work (even if only one page, Next should disable)
    const next = screen.getByRole("button", { name: "Next" });
    expect(next).toBeDisabled();
  });

  it("disables Set BG when selectedIsSection is false", () => {
    render(<MediaLibrary onInsertImage={() => {}} onSetSectionBackground={() => {}} selectedIsSection={false} />);
    expect(screen.getAllByRole("button", { name: "Set BG" })[0]).toBeDisabled();
  });
});
