import { fireEvent, render, screen } from "@testing-library/react";
import PageBuilder from "../src/components/cms/PageBuilder";
import CanvasItem from "../src/components/cms/page-builder/CanvasItem";
import React from "react";

type Page = any; // use 'any' to simplify

// mock useDroppable to control isOver state
let droppableIsOver = false;

jest.mock("@dnd-kit/core", () => {
  const actual = jest.requireActual("@dnd-kit/core");
  return {
    ...actual,
    useDroppable: jest.fn(() => ({
      setNodeRef: jest.fn(),
      isOver: droppableIsOver,
    })),
  };
});

jest.mock("@dnd-kit/sortable", () => {
  const actual = jest.requireActual("@dnd-kit/sortable");
  return {
    ...actual,
    useSortable: jest.fn(() => ({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
    })),
    SortableContext: ({ children }: any) => <div>{children}</div>,
    rectSortingStrategy: jest.fn(),
  };
});

jest.mock("../src/components/cms/page-builder/Block", () => () => <div />);

describe("PageBuilder drag highlight", () => {
  const basePage = {
    id: "p1",
    updatedAt: "2024-01-01",
    slug: "slug",
    status: "draft",
    seo: { title: { en: "" }, description: {} },
    components: [],
  } as Page;

  it("toggles ring on canvas during drag", () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onPublish = jest.fn().mockResolvedValue(undefined);
    const { container } = render(
      <PageBuilder page={basePage} onSave={onSave} onPublish={onPublish} />
    );
    const canvas = container.querySelector("#canvas") as HTMLElement;
    expect(canvas.className).not.toMatch(/ring-2/);
    fireEvent.dragOver(canvas);
    expect(canvas.className).toMatch(/ring-2/);
    fireEvent.dragLeave(canvas);
    expect(canvas.className).not.toMatch(/ring-2/);
  });

  it("shows placeholder when dragging over container", () => {
    const component: any = {
      id: "c1",
      type: "Section",
      children: [{ id: "child", type: "Text" }],
    };
    droppableIsOver = true;
    const { container, rerender } = render(
      <CanvasItem
        component={component}
        index={0}
        parentId={undefined}
        selectedId={null}
        onSelectId={() => {}}
        onRemove={() => {}}
        dispatch={() => {}}
        locale="en"
        gridCols={12}
      />
    );
    expect(container.querySelector('[data-placeholder]')).toBeInTheDocument();
    droppableIsOver = false;
    rerender(
      <CanvasItem
        component={component}
        index={0}
        parentId={undefined}
        selectedId={null}
        onSelectId={() => {}}
        onRemove={() => {}}
        dispatch={() => {}}
        locale="en"
        gridCols={12}
      />
    );
    expect(container.querySelector('[data-placeholder]')).toBeNull();
  });
});

