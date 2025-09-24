import { render, screen } from "@testing-library/react";
import CommentsDrawer from "../CommentsDrawer";

describe("CommentsDrawer a11y", () => {
  it("wires aria-describedby to an existing DialogDescription", async () => {
    const threads = [
      {
        id: "t1",
        componentId: "c1",
        resolved: false,
        messages: [],
      },
    ] as any;

    render(
      <CommentsDrawer
        open={true}
        onOpenChange={() => {}}
        threads={threads}
        selectedId={"t1"}
        onSelect={() => {}}
        onAddMessage={async () => {}}
        onToggleResolved={async () => {}}
        onAssign={async () => {}}
        shop="shop-1"
        me="me@example.com"
      />
    );

    const dialog = await screen.findByRole("dialog");
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const descEl = describedBy ? document.getElementById(describedBy) : null;
    expect(descEl).toBeTruthy();
  });
});

