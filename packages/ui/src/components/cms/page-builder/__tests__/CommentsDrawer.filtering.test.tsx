import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentsDrawer from "../CommentsDrawer";

// Keep details lightweight to focus on list behavior
jest.mock("../CommentsThreadDetails", () => ({ __esModule: true, default: () => <div data-cy="details" /> }));

describe("CommentsDrawer filtering/search/sort", () => {
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

  it("filters by status, assigned, searches text and sorts by updated desc with open first", async () => {
    const user = userEvent.setup();
    const threads = [
      make("open1", { resolved: false, assignedTo: null, updatedAt: "2024-01-03T00:00:00.000Z", messages: [{ id: "m1", text: "hello bob", ts: "2024-01-03" }] }),
      make("open2", { resolved: false, assignedTo: "alice", updatedAt: "2024-01-04T00:00:00.000Z" }),
      make("resolved1", { resolved: true, assignedTo: "carol", updatedAt: "2024-01-05T00:00:00.000Z" }),
      make("open3", { resolved: false, assignedTo: null, updatedAt: "2024-01-02T00:00:00.000Z" }),
    ];

    render(
      <CommentsDrawer
        open={true}
        onOpenChange={() => {}}
        threads={threads}
        selectedId={null}
        onSelect={() => {}}
        onAddMessage={async () => {}}
        onToggleResolved={async () => {}}
        onAssign={async () => {}}
        shop="shop-1"
        me="ali" // should match assignedTo "alice" for Assigned filter
      />
    );

    // Default filter is Open; expect 3 open items sorted by updatedAt desc: open2, open1, open3
    const getItems = () => screen.queryAllByRole("listitem");
    expect(getItems()).toHaveLength(3);
    // First row should contain componentId for open2
    expect(getItems()[0]).toHaveTextContent("c-open2");

    // Resolved filter shows only resolved items
    await user.click(screen.getByRole("button", { name: "Resolved" }));
    expect(getItems()).toHaveLength(1);
    expect(getItems()[0]).toHaveTextContent("c-resolved1");

    // Assigned filter uses "me" to include only matching assignee
    await user.click(screen.getByRole("button", { name: "Assigned" }));
    expect(getItems()).toHaveLength(1);
    expect(getItems()[0]).toHaveTextContent("c-open2");

    // All + search query matches message text (bob)
    await user.click(screen.getByRole("button", { name: "All" }));
    await user.type(screen.getByPlaceholderText("Search..."), "bob");
    expect(getItems()).toHaveLength(1);
    expect(getItems()[0]).toHaveTextContent("c-open1");
  });
});

