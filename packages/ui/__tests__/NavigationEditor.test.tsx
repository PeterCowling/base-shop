import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { act } from "react";
import NavigationEditor, { NavItem } from "../src/components/cms/NavigationEditor";

let dndHandlers: any = {};

jest.mock("@dnd-kit/core", () => {
  const React = require("react");
  return {
    DndContext: (props: any) => {
      dndHandlers = props;
      return <div>{props.children}</div>;
    },
    PointerSensor: function PointerSensor() {},
    KeyboardSensor: function KeyboardSensor() {},
    useSensor: () => ({}),
    useSensors: (...sensors: any[]) => sensors,
  };
});

jest.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: any) => <div>{children}</div>,
  verticalListSortingStrategy: jest.fn(),
  sortableKeyboardCoordinates: jest.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  arrayMove: (arr: any[], from: number, to: number) => {
    const copy = arr.slice();
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  },
}));

jest.mock("ulid", () => ({ ulid: () => "new-id" }));

describe("NavigationEditor", () => {
  it("adds, renames, reorders items and exposes accessible roles", () => {
    let current: NavItem[] = [
      { id: "1", label: "Home", url: "/", children: [] },
      { id: "2", label: "About", url: "/about", children: [] },
    ];

    function Wrapper() {
      const [items, setItems] = React.useState<NavItem[]>(current);
      current = items;
      return <NavigationEditor items={items} onChange={setItems} />;
    }

    render(<Wrapper />);

    // Accessibility
    expect(screen.getByRole("button", { name: /add item/i })).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();

    // Add item
    fireEvent.click(screen.getByRole("button", { name: /add item/i }));
    expect(screen.getAllByPlaceholderText("Label")).toHaveLength(3);

    // Rename new item
    const inputs = screen.getAllByPlaceholderText("Label");
    fireEvent.change(inputs[2], { target: { value: "Contact" } });
    expect(current[2].label).toBe("Contact");

    // Reorder: move "About" before "Home"
    const firstId = current[0].id; // "1"
    const secondId = current[1].id; // "2"

    act(() => {
      dndHandlers.onDragStart({ active: { id: secondId } });
    });
    act(() => {
      dndHandlers.onDragOver({
        active: { id: secondId, rect: { current: { translated: { top: 0 } } } },
        over: { id: firstId, rect: { top: 0, height: 10 } },
      });
    });
    act(() => {
      dndHandlers.onDragEnd({ active: { id: secondId } });
    });

    expect(current.map((i) => i.id)).toEqual([secondId, firstId, "new-id"]);

    // Accessibility check for list items
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("renders nested lists and updates child label", () => {
    const items: NavItem[] = [
      {
        id: "1",
        label: "Parent",
        url: "/parent",
        children: [{ id: "1-1", label: "Child", url: "/child", children: [] }],
      },
    ];
    const onChange = jest.fn();
    const { container } = render(
      <NavigationEditor items={items} onChange={onChange} />
    );

    const nested = container.querySelector("ul ul");
    // Uses logical properties: margin-inline-start
    expect(nested).toHaveClass("ms-4");

    const childInput = screen.getAllByPlaceholderText("Label")[1];
    fireEvent.change(childInput, { target: { value: "Updated" } });

    expect(onChange).toHaveBeenCalledWith([
      {
        id: "1",
        label: "Parent",
        url: "/parent",
        children: [
          { id: "1-1", label: "Updated", url: "/child", children: [] },
        ],
      },
    ]);
  });
});
