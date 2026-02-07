import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import SectionsPanel from "../SectionsPanel";

describe("SectionsPanel load more", () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn();
  });
  afterEach(() => jest.resetAllMocks());

  it("calls server again when Load more clicked (hasMore)", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({
      items: [
        { id: "s1", label: "Hero", status: "published", template: { id: "t1", type: "Section" } },
        { id: "s2", label: "Footer", status: "published", template: { id: "t2", type: "Section" } },
      ],
      total: 5,
      allTags: ["hero"],
    }) } as any);
    render(<SectionsPanel shop="acme" onInsert={() => {}} />);
    await screen.findByText("Hero");
    // hasMore true → Load more visible
    fireEvent.click(screen.getByRole("button", { name: /Load more|Loading…|Loaded/ }));
    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(1);
    });
  });
});
