import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TextBlockView from "../TextBlockView";

// Mocks
jest.mock("../MenuBar", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("../LinkPicker", () => ({ __esModule: true, default: ({ open }: any) => (open ? <div>LinkPickerOpen</div> : null) }));
jest.mock("@tiptap/react", () => ({ __esModule: true, EditorContent: (p: any) => <div data-ec {...p} /> }));

function makeEditor() {
  const run = jest.fn(() => true);
  const chainApi = {
    toggleBold: () => ({ run }),
    toggleItalic: () => ({ run }),
    toggleUnderline: () => ({ run }),
    toggleBulletList: () => ({ run }),
    toggleOrderedList: () => ({ run }),
    toggleHeading: () => ({ run }),
  };
  const api = {
    chain: () => ({ focus: () => chainApi }),
    on: jest.fn(),
    off: jest.fn(),
  } as any;
  return { editor: api, run };
}

describe("TextBlockView toolbar", () => {
  it("renders toolbar and triggers editor chain on button clicks", () => {
    // Stub selection + rects so toolbar becomes visible
    const rangeRect = { left: 10, top: 10, width: 20, height: 10 } as any;
    const selection = {
      rangeCount: 1,
      getRangeAt: () => ({ getBoundingClientRect: () => rangeRect }),
    } as any;
    jest.spyOn(window, "getSelection").mockReturnValue(selection);

    const { editor, run } = makeEditor();
    const containerRef = { current: null } as React.RefObject<HTMLDivElement>;
    const { container } = render(
      <TextBlockView
        selected={true}
        attributes={{} as any}
        setNodeRef={() => {}}
        containerRef={containerRef}
        isDragging={false}
        style={{}}
        guides={{ x: null, y: null }}
        snapping={false}
        editor={editor}
        editing={true}
        onStartEditing={() => {}}
        onFinishEditing={() => {}}
        startDrag={() => {}}
        startResize={() => {}}
        onSelect={() => {}}
        onRemove={() => {}}
        content="Hello"
      />
    );
    // Provide host rect used by effect
    const host = container.querySelector('[role="listitem"]') as HTMLElement;
    host.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 200 } as any);

    // Buttons should now be present
    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    fireEvent.click(screen.getByRole("button", { name: "Italic" }));
    fireEvent.click(screen.getByRole("button", { name: "Underline" }));
    fireEvent.click(screen.getByRole("button", { name: "Bulleted" }));
    fireEvent.click(screen.getByRole("button", { name: "Numbered" }));
    fireEvent.click(screen.getByRole("button", { name: "H2" }));
    expect(run).toHaveBeenCalled();

    // Link opens picker
    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(screen.getByText("LinkPickerOpen")).toBeInTheDocument();
  });
});

