import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentsDrawer from "../CommentsDrawer";
import PagesPanel from "../PagesPanel";
import CMSPanel from "../CMSPanel";

describe("CMS drawers surfaces", () => {
  it("CommentsDrawer uses panel surface and right border", async () => {
    render(
      <CommentsDrawer
        open
        onOpenChange={() => {}}
        threads={[]}
        selectedId={null}
        onSelect={() => {}}
        onAddMessage={() => {}}
        onToggleResolved={() => {}}
        onAssign={() => {}}
        shop="s"
      />
    );
    const dialog = await screen.findByRole("dialog");
    const cls = dialog.className;
    expect(cls).toMatch(/bg-panel/);
    expect(cls).toMatch(/border-l/);
  });

  it("PagesPanel uses panel surface and left border", async () => {
    render(<PagesPanel open onOpenChange={() => {}} /> as any);
    const dialog = await screen.findByRole("dialog");
    const cls = dialog.className;
    expect(cls).toMatch(/bg-panel/);
    expect(cls).toMatch(/border-r/);
  });

  it("CMSPanel uses panel surface and right border", async () => {
    render(<CMSPanel open onOpenChange={() => {}} components={[]} selectedIds={[]} onSelectIds={() => {}} />);
    const dialog = await screen.findByRole("dialog");
    const cls = dialog.className;
    expect(cls).toMatch(/bg-panel/);
    expect(cls).toMatch(/border-l/);
  });
});

