import React from "react";
import { render } from "@testing-library/react";

import type { PageComponent } from "@acme/types";

import BlockChildren from "../BlockChildren";

const mockCanvasItem = jest.fn((_props: unknown) => null);
jest.mock("../CanvasItem", () => ({
  __esModule: true,
  default: (props: unknown) => mockCanvasItem(props),
}));

describe("BlockChildren", () => {
  const createProps = (overrides: Partial<React.ComponentProps<typeof BlockChildren>> = {}) => ({
    component: { id: "parent", type: "Container" } as unknown as PageComponent,
    selectedIds: [],
    onSelect: jest.fn(),
    dispatch: jest.fn(),
    locale: "en" as const,
    gridCols: 12,
    viewport: "desktop" as const,
    isOver: false,
    setDropRef: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    mockCanvasItem.mockClear();
  });

  it("renders null when no childComponents", () => {
    const { container } = render(<BlockChildren {...createProps()} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows placeholder when isOver is true", () => {
    const childComponents: PageComponent[] = [
      { id: "c1", type: "Foo" } as any,
    ];
    const { container } = render(
      <BlockChildren
        {...createProps({
          childComponents,
          isOver: true,
          insertParentId: "parent",
          insertIndex: 0,
        })}
      />
    );
    expect(container.querySelector("[data-placeholder]")).toBeInTheDocument();
  });

  it("does not show placeholder when isOver is false", () => {
    const childComponents: PageComponent[] = [
      { id: "c1", type: "Foo" } as any,
    ];
    const { container } = render(
      <BlockChildren {...createProps({ childComponents, isOver: false })} />
    );
    expect(
      container.querySelector("[data-placeholder]")
    ).not.toBeInTheDocument();
  });

  it("renders each child as CanvasItem with correct props", () => {
    const dispatch = jest.fn();
    const childComponents: PageComponent[] = [
      { id: "c1", type: "Foo" } as any,
      { id: "c2", type: "Bar" } as any,
    ];
    render(
      <BlockChildren
        {...createProps({ childComponents, dispatch })}
      />
    );
    expect(mockCanvasItem).toHaveBeenCalledTimes(2);
    expect(mockCanvasItem).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        component: childComponents[0],
        index: 0,
        dispatch,
        locale: "en",
      })
    );
    expect(mockCanvasItem).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        component: childComponents[1],
        index: 1,
        dispatch,
        locale: "en",
      })
    );
  });

  it("dispatches remove action when a child onRemove is triggered", () => {
    const dispatch = jest.fn();
    const childComponents: PageComponent[] = [
      { id: "c1", type: "Foo" } as any,
    ];
    render(
      <BlockChildren {...createProps({ childComponents, dispatch })} />
    );
    const props = (mockCanvasItem.mock.calls[0] as unknown[])[0] as { onRemove: () => void };
    props.onRemove();
    expect(dispatch).toHaveBeenCalledWith({ type: "remove", id: "c1" });
  });
});
