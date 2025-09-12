import { fireEvent, render } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import NavigationEditor, { NavItem } from "../NavigationEditor";

var dndHandlers: any;
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
});

