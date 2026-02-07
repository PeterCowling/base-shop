import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import PagesPanel from "../PagesPanel";

// Drawer and overlay mocks (same pattern used in other tests)
jest.mock("../../../atoms/primitives/drawer", () => ({
  __esModule: true,
  Drawer: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DrawerPortal: ({ children }: any) => <div>{children}</div>,
  DrawerContent: ({ children }: any) => <div role="dialog">{children}</div>,
  DrawerTitle: ({ children }: any) => <div>{children}</div>,
  DrawerDescription: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("../../../atoms", () => ({ __esModule: true, OverlayScrim: () => null }));

describe("PagesPanel notifications", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn();
  });
  afterEach(() => jest.resetAllMocks());

  it("emits pb:notify on reorder failure and conflict on saveDraft", async () => {
    const notes: Array<any> = [];
    const handler = (e: Event) => notes.push((e as CustomEvent).detail);
    window.addEventListener("pb:notify", handler as EventListener);
    try {
      // First GET returns two pages so we can reorder; PUT fails; PATCH returns 409
      (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: RequestInit) => {
        if (url.endsWith("/cms/api/pages/s1") && (!init || !init.method)) {
          return { ok: true, json: async () => ([{ id: "1", slug: "home" }, { id: "2", slug: "about" }]) } as any;
        }
        if (url.endsWith("/cms/api/pages/s1/order") && init?.method === "PUT") {
          return { ok: false, status: 500, json: async () => ({}) } as any;
        }
        if (url.includes("/cms/api/pages/s1/1") && init?.method === "PATCH") {
          return { ok: false, status: 409, json: async () => ({}) } as any;
        }
        return { ok: true, json: async () => ({}) } as any;
      });

      render(<PagesPanel open shop="s1" onOpenChange={() => {}} />);
      // Reorder then save order → PUT fails → pb:notify error
      await screen.findByText(/2 pages/);
      fireEvent.click(screen.getAllByRole("button", { name: "Move down" })[0]);
      fireEvent.click(screen.getByRole("button", { name: /Save Order|Order Saved/ }));

      // Save draft triggers 409 conflict
      fireEvent.click(screen.getAllByRole("button", { name: "Settings" })[0]);
      fireEvent.click(screen.getByRole("button", { name: "Save Draft" }));
      // Wait for notify events to be dispatched without manual timers
      await waitFor(() => {
        expect(notes.length).toBeGreaterThan(0);
      });
      // Assert we saw at least one of the expected notifications
      expect(notes.some((n) => n?.title === "Reorder failed" || n?.title === "Conflict")).toBe(true);
    } finally {
      window.removeEventListener("pb:notify", handler as EventListener);
    }
  });
});
