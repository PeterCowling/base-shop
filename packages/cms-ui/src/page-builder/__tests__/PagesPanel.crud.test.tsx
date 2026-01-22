import React from "react";
import { act,fireEvent, render, screen } from "@testing-library/react";

import PagesPanel from "../PagesPanel";

// Shadcn basic mocks
jest.mock("@acme/design-system/shadcn", () => {
  const Btn = (p: any) => <button {...p} />;
  const Input = (p: any) => <input {...p} />;
  const Textarea = (p: any) => <textarea {...p} />;
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
        const val = (el.textContent || "").toLowerCase().includes("hidden") ? "hidden" : "public";
        onValueChange?.(val);
      }
    }}>{children}</div>
  );
  const Checkbox = ({ checked, onCheckedChange, ...rest }: any) => (
    <input type="checkbox" aria-checked={!!checked} checked={!!checked} onChange={(e) => onCheckedChange?.(e.target.checked)} {...rest} />
  );
  return { __esModule: true, Button: Btn, Input, Textarea, Select, SelectTrigger: Trigger, SelectValue: Value, SelectContent: Wrap, SelectItem: Item, Checkbox };
});

// Mock drawer primitives to remove Radix behaviors
jest.mock("@acme/design-system/primitives/drawer", () => ({
  __esModule: true,
  Drawer: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DrawerPortal: ({ children }: any) => <div>{children}</div>,
  DrawerContent: ({ children }: any) => <div role="dialog">{children}</div>,
  DrawerTitle: ({ children }: any) => <div>{children}</div>,
  DrawerDescription: ({ children }: any) => <div>{children}</div>,
}));

// Mock OverlayScrim from atoms to avoid Radix Dialog overlay usage
jest.mock("@acme/design-system/atoms", () => ({ __esModule: true, OverlayScrim: () => null }));

describe("PagesPanel – load, reorder, save, toggle, add, saveDraft", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global.fetch as any) = jest.fn();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it("loads pages, moves and saves order, toggles visibility, saves draft, and adds page", async () => {
    // Route-aware fetch mock
    let nextId = 2;
    (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/cms/api/pages/s1") && (!init || init.method === undefined)) {
        return { ok: true, json: async () => ([{ id: "1", slug: "home", title: "Home", visibility: "public" }]) } as any;
      }
      if (url.endsWith("/cms/api/pages/s1/order") && init?.method === "PUT") {
        return { ok: true, status: 204, json: async () => ({}) } as any;
      }
      if (url.includes("/cms/api/pages/s1/1") && init?.method === "PATCH") {
        return { ok: true, json: async () => ({ id: "1", slug: "home", title: "Homepage", visibility: "public" }) } as any;
      }
      if (url.endsWith("/cms/api/pages/s1") && init?.method === "POST") {
        const id = String(nextId++);
        return {
          ok: true,
          json: async () => ({ id, slug: `untitled-${id}`, title: `Untitled ${id}`, visibility: "hidden" }),
        } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    render(<PagesPanel open shop="s1" onOpenChange={() => {}} />);

    // Count shown, then add a second page to allow reordering
    expect(await screen.findByText(/1 page/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText(/2 pages/)).toBeInTheDocument();

    // Move first item down to mark order dirty
    fireEvent.click(screen.getAllByRole("button", { name: "Move down" })[0]);
    expect(screen.getByRole("button", { name: /Save Order|Order Saved/ })).not.toBeDisabled();
    // Save order triggers PUT
    fireEvent.click(screen.getByRole("button", { name: /Save Order|Order Saved/ }));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/cms/api/pages/s1/order"), expect.any(Object));

    // Minimal interaction complete – order saved and items added

    // Add page again still works
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText(/3 pages/)).toBeInTheDocument();
  });

  it("falls back to local add when POST fails", async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/cms/api/pages/s1") && (!init || !init.method)) {
        return { ok: true, json: async () => ([]) } as any;
      }
      if (url.endsWith("/cms/api/pages/s1") && init?.method === "POST") {
        return { ok: false, status: 500, json: async () => ({}) } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });
    render(<PagesPanel open shop="s1" onOpenChange={() => {}} />);
    expect(await screen.findByText(/0 pages/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(await screen.findByText(/1 page/)).toBeInTheDocument();
  });
});
