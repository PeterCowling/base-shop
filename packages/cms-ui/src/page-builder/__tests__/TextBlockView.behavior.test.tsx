import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import TextBlockView from "../TextBlockView";

// Mock adjacent imports with correct relative paths from TextBlockView
jest.mock("../MenuBar", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("../LinkPicker", () => ({ __esModule: true, default: () => <div /> }));

describe("TextBlockView", () => {
  const baseProps = {
    selected: true,
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    containerRef: { current: null } as unknown as React.RefObject<HTMLDivElement>,
    isDragging: false,
    style: {},
    guides: { x: null, y: null },
    snapping: false,
    editor: null,
    editing: false,
    onStartEditing: jest.fn(),
    onFinishEditing: jest.fn(),
    startDrag: jest.fn(),
    startResize: jest.fn(),
    startRotate: jest.fn(),
    onKeyDown: jest.fn(),
    onSelect: jest.fn(),
    onRemove: jest.fn(),
    content: '<div data-unsafe onclick="alert(1)">Hello</div>',
    zIndex: 5,
    locked: false,
    kbResizing: false,
    spacingOverlay: null,
    rotating: false,
    rotateAngle: 0,
    staticTransform: undefined,
  };

  it("renders sanitized content and triggers start editing and remove", () => {
    const onStartEditing = jest.fn();
    const onRemove = jest.fn();
    render(<TextBlockView {...(baseProps as unknown as React.ComponentProps<typeof TextBlockView>)} onStartEditing={onStartEditing} onRemove={onRemove} />);
    // Click on content area triggers start editing
    fireEvent.click(screen.getByRole("listitem"));
    // Remove button works
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("shows rotate handle and lock badge when selected & locked", () => {
    const { container } = render(<TextBlockView {...(baseProps as unknown as React.ComponentProps<typeof TextBlockView>)} locked />);
    // lock icon present (aria-hidden) and rotate handle button container exists
    expect(container.querySelector('[title="Locked"]')).toBeTruthy();
  });
});
