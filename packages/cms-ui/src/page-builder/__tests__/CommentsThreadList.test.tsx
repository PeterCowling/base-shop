import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CommentsThreadList from "../CommentsThreadList";

const makeThread = (id: string, overrides: Partial<any> = {}) => ({
  id,
  componentId: `comp-${id}`,
  resolved: false,
  assignedTo: null,
  messages: [{ id: `m-${id}`, text: `hello ${id}`, ts: new Date().toISOString() }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe("CommentsThreadList", () => {
  it("renders list, toggles new thread form, and calls handlers", async () => {
    const user = userEvent.setup();
    const threads = [
      makeThread("1", { assignedTo: "alice" }),
      makeThread("2", { resolved: true, assignedTo: "bob" }),
      makeThread("3"),
    ];
    const filtered = threads; // parent does filtering; pass full list here
    const onFilterChange = jest.fn();
    const onQueryChange = jest.fn();
    const onSelect = jest.fn();
    const onCreate = jest.fn();
    const componentsOptions = [
      { id: "c-1", label: "Component 1" },
      { id: "c-2", label: "Component 2" },
    ];

    render(
      <CommentsThreadList
        threads={threads}
        filtered={filtered}
        filter="open"
        onFilterChange={onFilterChange}
        query=""
        onQueryChange={onQueryChange}
        selectedId={null}
        onSelect={onSelect}
        componentsOptions={componentsOptions}
        onCreate={onCreate}
      />
    );

    // Filter buttons wire up
    await user.click(screen.getByRole("button", { name: "All" }));
    await user.click(screen.getByRole("button", { name: "Open" }));
    await user.click(screen.getByRole("button", { name: "Resolved" }));
    await user.click(screen.getByRole("button", { name: "Assigned" }));
    expect(onFilterChange).toHaveBeenCalledTimes(4);

    // Search input sends query updates
    await user.type(screen.getByPlaceholderText("Search..."), "text");
    expect(onQueryChange).toHaveBeenCalled();

    // New thread button shows form; create disabled until inputs filled
    await user.click(screen.getByRole("button", { name: "New thread" }));
    const create = screen.getByRole("button", { name: "Create" });
    expect(create).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Initial comment"), "Hello new");
    // Still disabled until a component is chosen; cancel out
    expect(create).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    // List item selection
    const firstRow = screen.getAllByRole("listitem")[0];
    const rowButton = within(firstRow).getByRole("button");
    await user.click(rowButton);
    const id = within(firstRow).getByText(/comp-1/);
    expect(onSelect).toHaveBeenCalledWith("1");
    expect(id).toBeInTheDocument();
  });
});
