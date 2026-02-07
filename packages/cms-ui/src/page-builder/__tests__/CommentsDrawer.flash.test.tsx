import { act,render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CommentsDrawer from "../CommentsDrawer";

describe("CommentsDrawer jump flash", () => {
  function make(id: string, opts: Partial<any> = {}) {
    return {
      id,
      componentId: `c-${id}`,
      resolved: false,
      assignedTo: null,
      messages: [{ id: `m-${id}`, text: `msg ${id}`, ts: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...opts,
    } as any;
  }

  it("highlights the selected list item briefly after Jump", async () => {
    const user = userEvent.setup();
    const threads = [make("1"), make("2")];
    render(
      <CommentsDrawer
        open={true}
        onOpenChange={() => {}}
        threads={threads}
        selectedId={"1"}
        onSelect={() => {}}
        onAddMessage={async () => {}}
        onToggleResolved={async () => {}}
        onAssign={async () => {}}
        shop="shop-1"
      />
    );
    // Jump button lives in details panel; click it to trigger flash
    await user.click(screen.getByRole("button", { name: "Jump" }));
    const rows = screen.getAllByRole("listitem");
    // One of the rows should carry the flash class
    expect(rows.some((li) => li.className.includes("animate-pulse"))).toBe(true);
  });

  it("clears the flash highlight after timeout", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const threads = [make("1"), make("2")];
    render(
      <CommentsDrawer
        open={true}
        onOpenChange={() => {}}
        threads={threads}
        selectedId={"1"}
        onSelect={() => {}}
        onAddMessage={async () => {}}
        onToggleResolved={async () => {}}
        onAssign={async () => {}}
        shop="shop-1"
      />
    );
    await user.click(screen.getByRole("button", { name: "Jump" }));
    let rows = screen.getAllByRole("listitem");
    expect(rows.some((li) => li.className.includes("animate-pulse"))).toBe(true);
    // Advance beyond the 1200ms timeout used in the component
    await act(async () => {
      jest.advanceTimersByTime(1300);
    });
    // Re-query and assert flash removed
    rows = screen.getAllByRole("listitem");
    expect(rows.some((li) => li.className.includes("animate-pulse"))).toBe(false);
    jest.useRealTimers();
  });
});
