import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import SectionsPanel from "../SectionsPanel";

describe("SectionsPanel", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn();
  });
  afterEach(() => jest.resetAllMocks());

  it("loads sections, searches, inserts presets and server items, supports linked insert and load more", async () => {
    const onInsert = jest.fn();
    const onInsertLinked = jest.fn();
    // First load returns items stub
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ items: [
      { id: "s1", label: "Hero", status: "published", template: { id: "x", type: "Section" }, thumbnail: "/thumb.jpg", tags: ["hero"] },
    ], total: 1 }) } as any);

    render(<SectionsPanel shop="acme" onInsert={onInsert} onInsertLinked={onInsertLinked} />);
    // Search triggers debounced reload
    fireEvent.change(screen.getByLabelText("Search sections"), { target: { value: "hero" } });
    // Insert demo preset
    fireEvent.click(screen.getByRole("button", { name: "Title + CTA" }));
    expect(onInsert).toHaveBeenCalled();
    // Insert copy and linked
    fireEvent.click(await screen.findByRole("button", { name: "Insert copy" }));
    expect(onInsert).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Insert linked" }));
    expect(onInsertLinked).toHaveBeenCalled();
    // Load more button present (with hasMore=false it still renders with Loaded/Load more/Loading state logic)
    expect(screen.getByRole("button", { name: /Load/ })).toBeInTheDocument();
  });
});

