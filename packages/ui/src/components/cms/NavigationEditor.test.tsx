import { render, fireEvent } from "@testing-library/react";
import NavigationEditor, { NavItem } from "./NavigationEditor";

jest.mock("ulid", () => ({ ulid: () => "new-id" }));

describe("NavigationEditor", () => {
  it("adds and edits items", () => {
    const items: NavItem[] = [{ id: "1", label: "Home", url: "/", children: [] }];
    const onChange = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <NavigationEditor items={items} onChange={onChange} />
    );

    fireEvent.click(getByText("Add Item"));
    expect(onChange).toHaveBeenCalledWith([
      ...items,
      { id: "new-id", label: "", url: "", children: [] },
    ]);

    fireEvent.change(getByPlaceholderText("Label"), {
      target: { value: "Updated" },
    });
    expect(onChange).toHaveBeenCalledWith([
      { id: "1", label: "Updated", url: "/", children: [] },
    ]);
  });
});
