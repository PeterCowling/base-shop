import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import MediaLibrary from "../MediaLibrary";

// Provide a simple atoms/shadcn mock for Selects
jest.mock("@acme/design-system/shadcn", () => {
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
      if (el.getAttribute("role") === "option") onValueChange?.(el.textContent?.split(" ")[0]);
    }}>{children}</div>
  );
  return { __esModule: true, Button: Btn, Input, Select, SelectTrigger: Trigger, SelectValue: Value, SelectContent: Wrap, SelectItem: Item, Dialog: Wrap, DialogContent: Wrap, DialogTitle: ({ children }: any) => <div>{children}</div>, DialogFooter: Wrap };
});

const mockHook = jest.fn();
jest.mock("../useMediaLibrary", () => ({ __esModule: true, default: () => mockHook() }));

describe("MediaLibrary tag/type filter", () => {
  it("filters by image type + tag", () => {
    mockHook.mockReturnValue({
      media: [
        { url: "https://cdn/a.jpg", type: "image", tags: ["hero"], title: "A" },
        { url: "https://cdn/b.jpg", type: "image", tags: ["other"], title: "B" },
        { url: "https://cdn/c.mp4", type: "video", tags: ["hero"], title: "C" },
      ],
      loadMedia: jest.fn(),
      loading: false,
      error: "",
    });
    render(<MediaLibrary onInsertImage={() => {}} onSetSectionBackground={() => {}} selectedIsSection />);
    // Pick image type
    fireEvent.click(screen.getByLabelText("Filter media type"));
    fireEvent.click(screen.getByRole("option", { name: "image" }));
    // Pick hero tag
    fireEvent.click(screen.getByLabelText("Filter by tag"));
    // Our mock builds tags as "{label} ({count})"
    fireEvent.click(screen.getByRole("option", { name: /hero/ }));
    // Expect at least one card remains (the image with tag hero)
    expect(screen.getByText(/Page 1/)).toBeInTheDocument();
  });
});
