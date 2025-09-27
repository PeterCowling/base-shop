import { fireEvent, render } from "@testing-library/react";
import { act } from "react";
import NavigationEditor, { NavItem } from "../NavigationEditor";

let dndHandlers: any;
jest.mock("@dnd-kit/core", () => {
  const actual = jest.requireActual("@dnd-kit/core");
  return {
    ...actual,
    DndContext: (props: any) => {
      dndHandlers = props;
      return <div>{props.children}</div>;
    },
  };
});

jest.mock("ulid", () => ({ ulid: () => "new-id" }));

describe("NavigationEditor", () => {
  it("adds a link to the tree", () => {
    const items: NavItem[] = [
      { id: "1", label: "Home", url: "/", children: [] },
    ];
    const onChange = jest.fn();
    const { getAllByRole } = render(
      <NavigationEditor items={items} onChange={onChange} />
    );

    const addChild = getAllByRole("button")[1];
    fireEvent.click(addChild);

    expect(onChange).toHaveBeenCalledWith([
      {
        id: "1",
        label: "Home",
        url: "/",
        children: [{ id: "new-id", label: "", url: "", children: [] }],
      },
    ]);
  });

  it("reorders nodes and persists order", () => {
    const items: NavItem[] = [
      { id: "1", label: "Home", url: "/home", children: [] },
      { id: "2", label: "Blog", url: "/blog", children: [] },
    ];
    const onChange = jest.fn();
    render(<NavigationEditor items={items} onChange={onChange} />);

    act(() => {
      dndHandlers.onDragStart({ active: { id: "1" } });
    });
    act(() => {
      dndHandlers.onDragOver({
        active: {
          id: "1",
          rect: { current: { translated: { top: 100 } } },
        },
        over: { id: "2", rect: { top: 0, height: 10 } },
      });
    });
    act(() => {
      dndHandlers.onDragEnd({ active: { id: "1" } });
    });

    expect(onChange).toHaveBeenCalledWith([
      { id: "2", label: "Blog", url: "/blog", children: [] },
      { id: "1", label: "Home", url: "/home", children: [] },
    ]);
  });

  it("does not call onChange when dropping item at original position", () => {
    const items: NavItem[] = [
      { id: "1", label: "Home", url: "/home", children: [] },
      { id: "2", label: "Blog", url: "/blog", children: [] },
    ];
    const onChange = jest.fn();
    render(<NavigationEditor items={items} onChange={onChange} />);

    act(() => {
      dndHandlers.onDragStart({ active: { id: "1" } });
    });
    act(() => {
      dndHandlers.onDragOver({
        active: { id: "1", rect: { current: { translated: { top: 0 } } } },
        over: { id: "1", rect: { top: 0, height: 10 } },
      });
    });
    act(() => {
      dndHandlers.onDragEnd({ active: { id: "1" } });
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("deletes a node", () => {
    const items: NavItem[] = [
      { id: "1", label: "Home", url: "/home", children: [] },
      { id: "2", label: "Blog", url: "/blog", children: [] },
    ];
    const onChange = jest.fn();
    const { getAllByRole } = render(
      <NavigationEditor items={items} onChange={onChange} />
    );

    const removeButton = getAllByRole("button")[2];
    fireEvent.click(removeButton);

    expect(onChange).toHaveBeenCalledWith([
      { id: "2", label: "Blog", url: "/blog", children: [] },
    ]);
  });

  it("updates item label via input", () => {
    const items: NavItem[] = [
      { id: "1", label: "Home", url: "/home", children: [] },
    ];
    const onChange = jest.fn();
    const { getByDisplayValue } = render(
      <NavigationEditor items={items} onChange={onChange} />
    );

    const labelInput = getByDisplayValue("Home") as HTMLInputElement;
    fireEvent.change(labelInput, { target: { value: "Dashboard" } });
    expect(onChange).toHaveBeenCalledWith([
      { id: "1", label: "Dashboard", url: "/home", children: [] },
    ]);
  });

  it("updates item url via input", () => {
    const items: NavItem[] = [
      { id: "1", label: "Home", url: "/home", children: [] },
    ];
    const onChange = jest.fn();
    const { getByDisplayValue } = render(
      <NavigationEditor items={items} onChange={onChange} />
    );

    const urlInput = getByDisplayValue("/home") as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: "/dashboard" } });
    expect(onChange).toHaveBeenCalledWith([
      { id: "1", label: "Home", url: "/dashboard", children: [] },
    ]);
  });

  it("sets insert index to end when not over any item", () => {
    const items: NavItem[] = [
      { id: "1", label: "Home", url: "/home", children: [] },
      { id: "2", label: "Blog", url: "/blog", children: [] },
    ];
    const { container } = render(
      <NavigationEditor items={items} onChange={() => void 0} />
    );

    act(() => {
      dndHandlers.onDragStart({ active: { id: "1" } });
    });
    act(() => {
      dndHandlers.onDragOver({ active: { id: "1" }, over: null });
    });

    const list = container.querySelector("ul")!;
    const placeholders = list.querySelectorAll("[data-placeholder]");
    expect(placeholders).toHaveLength(1);
    expect(list.lastElementChild).toBe(placeholders[0]);
  });

  it("inserts placeholder after item when dragged below midpoint", () => {
    const items: NavItem[] = [
      { id: "1", label: "Home", url: "/home", children: [] },
      { id: "2", label: "Blog", url: "/blog", children: [] },
      { id: "3", label: "About", url: "/about", children: [] },
    ];
    const { container } = render(
      <NavigationEditor items={items} onChange={() => void 0} />
    );

    act(() => {
      dndHandlers.onDragStart({ active: { id: "1" } });
    });
    act(() => {
      dndHandlers.onDragOver({
        active: { id: "1", rect: { current: { translated: { top: 6 } } } },
        over: { id: "2", rect: { top: 0, height: 10 } },
      });
    });

    const listItems = Array.from(container.querySelector("ul")!.children);
    const placeholderIndex = listItems.findIndex((el) =>
      el.hasAttribute("data-placeholder")
    );
    expect(placeholderIndex).toBe(2);
  });

  it("inserts placeholder before item when dragged above midpoint", () => {
    const items: NavItem[] = [
      { id: "1", label: "Home", url: "/home", children: [] },
      { id: "2", label: "Blog", url: "/blog", children: [] },
      { id: "3", label: "About", url: "/about", children: [] },
    ];
    const { container } = render(
      <NavigationEditor items={items} onChange={() => void 0} />
    );

    act(() => {
      dndHandlers.onDragStart({ active: { id: "3" } });
    });
    act(() => {
      dndHandlers.onDragOver({
        active: { id: "3", rect: { current: { translated: { top: 4 } } } },
        over: { id: "2", rect: { top: 0, height: 10 } },
      });
    });

    const listItems = Array.from(container.querySelector("ul")!.children);
    const placeholderIndex = listItems.findIndex((el) =>
      el.hasAttribute("data-placeholder")
    );
    expect(placeholderIndex).toBe(1);
  });

  it("cleans up insert index after drag end", () => {
    const items: NavItem[] = [
      { id: "1", label: "Home", url: "/home", children: [] },
      { id: "2", label: "Blog", url: "/blog", children: [] },
    ];
    const { container } = render(
      <NavigationEditor items={items} onChange={() => void 0} />
    );

    act(() => {
      dndHandlers.onDragStart({ active: { id: "1" } });
    });
    act(() => {
      dndHandlers.onDragOver({
        active: { id: "1", rect: { current: { translated: { top: 6 } } } },
        over: { id: "2", rect: { top: 0, height: 10 } },
      });
    });

    expect(container.querySelectorAll("[data-placeholder]")).toHaveLength(1);

    act(() => {
      dndHandlers.onDragEnd({ active: { id: "1" } });
    });

    expect(container.querySelector("[data-placeholder]")).toBeNull();
  });

  it("renders nested lists and allows reordering within a child list", () => {
    const items: NavItem[] = [
      {
        id: "1",
        label: "Parent",
        url: "/parent",
        children: [
          { id: "1-1", label: "Child A", url: "/a", children: [] },
          { id: "1-2", label: "Child B", url: "/b", children: [] },
        ],
      },
      { id: "2", label: "Sibling", url: "/sibling", children: [] },
    ];
    const onChange = jest.fn();
    const { container } = render(
      <NavigationEditor items={items} onChange={onChange} />
    );

    const lists = container.querySelectorAll("ul");
    expect(lists.length).toBeGreaterThan(1);

    act(() => {
      dndHandlers.onDragStart({ active: { id: "1-1" } });
    });
    act(() => {
      dndHandlers.onDragOver({
        active: { id: "1-1", rect: { current: { translated: { top: 6 } } } },
        over: { id: "1-2", rect: { top: 0, height: 10 } },
      });
    });

    expect(
      lists[0].querySelectorAll(":scope > [data-placeholder]")
    ).toHaveLength(0);
    expect(lists[1].lastElementChild).toHaveAttribute("data-placeholder");

    act(() => {
      dndHandlers.onDragEnd({ active: { id: "1-1" } });
    });

    expect(onChange).toHaveBeenCalledWith([
      {
        id: "1",
        label: "Parent",
        url: "/parent",
        children: [
          { id: "1-2", label: "Child B", url: "/b", children: [] },
          { id: "1-1", label: "Child A", url: "/a", children: [] },
        ],
      },
      { id: "2", label: "Sibling", url: "/sibling", children: [] },
    ]);
  });
});
