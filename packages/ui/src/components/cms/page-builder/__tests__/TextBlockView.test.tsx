import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

jest.mock("dompurify", () => ({
  __esModule: true,
  default: { sanitize: jest.fn(() => "sanitized-content") },
}));

jest.mock("../MenuBar", () => ({
  __esModule: true,
  default: () => <div data-cy="menu-bar" />,
}));

jest.mock("@tiptap/react", () => ({
  __esModule: true,
  EditorContent: () => <div data-cy="editor-content" />,
}));

import DOMPurify from "dompurify";
import TextBlockView from "../TextBlockView";

function createProps(overrides: Partial<React.ComponentProps<typeof TextBlockView>> = {}) {
  return {
    selected: false,
    attributes: {} as any,
    listeners: undefined,
    setNodeRef: jest.fn(),
    containerRef: { current: null },
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
    onSelect: jest.fn(),
    onRemove: jest.fn(),
    content: "<p>content</p>",
    zIndex: undefined,
    locked: false,
    ...overrides,
  };
}

describe("TextBlockView", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders sanitized content when not editing", () => {
    const content = "<script>alert('x')</script>";
    const props = createProps({ content });
    render(<TextBlockView {...props} />);
    expect((DOMPurify as any).sanitize).toHaveBeenCalledWith(content);
    expect(screen.getByText("sanitized-content")).toBeInTheDocument();
  });

  it("displays MenuBar and EditorContent when editing", () => {
    const props = createProps({ editing: true });
    render(<TextBlockView {...props} />);
    expect(screen.getByTestId("menu-bar")).toBeInTheDocument();
    expect(screen.getByTestId("editor-content")).toBeInTheDocument();
  });

  it("calls startDrag when dragging handle is used", () => {
    const startDrag = jest.fn();
    const props = createProps({ startDrag });
    render(<TextBlockView {...props} />);
    const handle = screen.getByTitle("Drag or press space/enter to move");
    fireEvent.pointerDown(handle);
    expect(startDrag).toHaveBeenCalled();
  });

  it("calls startResize when resize handles are used", () => {
    const startResize = jest.fn();
    const props = createProps({ selected: true, startResize });
    const { container } = render(<TextBlockView {...props} />);
    const handles = container.querySelectorAll(
      ".cursor-nwse-resize, .cursor-nesw-resize",
    );
    expect(handles.length).toBe(4);
    handles.forEach((h) => fireEvent.pointerDown(h));
    expect(startResize).toHaveBeenCalledTimes(4);
  });

  it("renders guides when x or y guide is provided", () => {
    const props = createProps({ guides: { x: 5, y: 10 } });
    const { container } = render(<TextBlockView {...props} />);
    const overlay = container.querySelector(
      ".pointer-events-none.absolute.inset-0.z-20",
    );
    expect(overlay).toBeInTheDocument();
    expect(overlay?.querySelector(".w-px.bg-primary")).toBeInTheDocument();
    expect(overlay?.querySelector(".h-px.bg-primary")).toBeInTheDocument();
  });

  it("invokes onRemove when remove button is clicked", () => {
    const onRemove = jest.fn();
    const props = createProps({ onRemove });
    render(<TextBlockView {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "×" }));
    expect(onRemove).toHaveBeenCalled();
  });
});
