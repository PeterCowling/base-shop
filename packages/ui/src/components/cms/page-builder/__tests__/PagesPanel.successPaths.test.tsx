import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PagesPanel from "../PagesPanel";

// Mocks
jest.mock("../../../atoms/primitives/drawer", () => ({
  __esModule: true,
  Drawer: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DrawerPortal: ({ children }: any) => <div>{children}</div>,
  DrawerContent: ({ children }: any) => <div role="dialog">{children}</div>,
  DrawerTitle: ({ children }: any) => <div>{children}</div>,
  DrawerDescription: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("../../../atoms", () => ({ __esModule: true, OverlayScrim: () => null }));

describe("PagesPanel success paths", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn();
  });
  afterEach(() => jest.resetAllMocks());

  it("toggles visibility and saves draft successfully", async () => {
    // GET 1 -> list; PATCH visibility ok; PATCH save returns updated title
    (global.fetch as jest.Mock).mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/cms/api/pages/s1") && (!init || !init.method)) {
        return { ok: true, json: async () => ([{ id: "1", slug: "home", title: "Home", visibility: "public" }]) } as any;
      }
      if (url.includes("/cms/api/pages/s1/1") && init?.method === "PATCH") {
        const body = JSON.parse(String(init.body || '{}'));
        if (body && body.visibility) return { ok: true, json: async () => ({}) } as any;
        return { ok: true, json: async () => ({ id: "1", slug: "home", title: "Homepage", visibility: "public" }) } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    });

    const user = userEvent.setup();
    const notes: Array<any> = [];
    const handler = (e: Event) => notes.push((e as CustomEvent).detail);
    window.addEventListener("pb:notify", handler as EventListener);
    try {
    render(<PagesPanel open shop="s1" onOpenChange={() => {}} />);
    await screen.findByText(/1 page/);

    // Toggle visibility (Show/Hide button text depends on current visibility)
    await user.click(screen.getByRole("button", { name: /Hide|Show/ }));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/cms/api/pages/s1/1"), expect.objectContaining({ method: "PATCH" }));

    // Save draft (selected is auto-initialized on load). Wait for success notify.
    await user.click(screen.getByRole("button", { name: "Save Draft" }));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/cms/api/pages/s1/1"), expect.objectContaining({ method: "PATCH" }));
    await screen.findByText(/1 page/); // dialog still present
    // Wait until the component dispatches a success notification
    await waitFor(() => {
      expect(notes.some((n) => n?.title === "Saved")).toBe(true);
    });
    } finally {
      window.removeEventListener("pb:notify", handler as EventListener);
    }
  });
});
