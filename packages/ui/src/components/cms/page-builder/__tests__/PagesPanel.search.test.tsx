import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PagesPanel from "../PagesPanel";

jest.mock("../../../atoms/primitives/drawer", () => ({
  __esModule: true,
  Drawer: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DrawerPortal: ({ children }: any) => <div>{children}</div>,
  DrawerContent: ({ children }: any) => <div role="dialog">{children}</div>,
  DrawerTitle: ({ children }: any) => <div>{children}</div>,
}));
jest.mock("../../../atoms", () => ({ __esModule: true, OverlayScrim: () => null }));

describe("PagesPanel search filter", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn();
  });
  afterEach(() => jest.resetAllMocks());

  it("filters list by query across title/slug", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ([
      { id: "1", slug: "home", title: "Home" },
      { id: "2", slug: "about", title: "About" },
    ]) } as any);
    render(<PagesPanel open shop="s1" onOpenChange={() => {}} />);
    await screen.findByText(/2 pages/);
    fireEvent.change(screen.getByPlaceholderText("Search pages…"), { target: { value: "home" } });
    // list count label updates to 1 page
    expect(await screen.findByText(/1 page/)).toBeInTheDocument();
  });
});

