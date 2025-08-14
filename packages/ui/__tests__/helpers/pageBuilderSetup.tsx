import { render } from "@testing-library/react";
import React from "react";

// stub complex subcomponents used by CanvasItem
jest.mock("../../src/components/cms/page-builder/Block", () => () => <div />);
jest.mock("../../src/components/cms/page-builder/MenuBar", () => () => <div />);
jest.mock("../../src/components/cms/page-builder/useTextEditor", () => () => ({}));
jest.mock("../../src/components/cms/page-builder/useSortableBlock", () =>
  jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    setDropRef: jest.fn(),
    transform: null,
    isDragging: false,
    isOver: false,
  }))
);

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

import CanvasItem from "../../src/components/cms/page-builder/CanvasItem";
import ComponentEditor from "../../src/components/cms/page-builder/ComponentEditor";

export { CanvasItem, ComponentEditor };

export function renderCanvasItem(component: any, options: any = {}) {
  const dispatch = jest.fn();
  const result = render(
    <CanvasItem
      component={component}
      index={0}
      parentId={undefined}
      selectedId={component.id}
      onSelectId={() => {}}
      onRemove={() => {}}
      dispatch={dispatch}
      locale="en"
      gridCols={12}
      viewport="desktop"
      {...options}
    />
  );
  const el = result.container.firstChild as HTMLElement;
  return { ...result, el, dispatch };
}

export function setRect(
  el: HTMLElement,
  rect: { width?: number; height?: number; left?: number; top?: number }
) {
  if (rect.width !== undefined)
    Object.defineProperty(el, "offsetWidth", { value: rect.width, writable: true });
  if (rect.height !== undefined)
    Object.defineProperty(el, "offsetHeight", { value: rect.height, writable: true });
  if (rect.left !== undefined)
    Object.defineProperty(el, "offsetLeft", { value: rect.left, writable: true });
  if (rect.top !== undefined)
    Object.defineProperty(el, "offsetTop", { value: rect.top, writable: true });
}
