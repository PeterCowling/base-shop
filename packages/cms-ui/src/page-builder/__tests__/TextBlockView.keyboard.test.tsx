import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import TextBlockView from "../TextBlockView";

jest.mock("../MenuBar", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("../LinkPicker", () => ({ __esModule: true, default: () => <div /> }));
// Mock tiptap's EditorContent to a simple div that passes through onKeyDown
jest.mock("@tiptap/react", () => ({ __esModule: true, EditorContent: (p: any) => <div data-ec {...p} /> }));

function makeEditor() {
  const run = jest.fn(() => true);
  const api = {
    chain: () => ({
      focus: () => ({
        toggleUnderline: () => ({ run }),
        toggleBold: () => ({ run }),
        toggleItalic: () => ({ run }),
        toggleBulletList: () => ({ run }),
        toggleOrderedList: () => ({ run }),
        toggleHeading: () => ({ run }),
      }),
    }),
    on: jest.fn(),
    off: jest.fn(),
  } as any;
  return { editor: api, run };
}

describe("TextBlockView keyboard handlers", () => {
  it("finishes editing on Enter and toggles underline with ctrl/cmd+U", () => {
    const { editor, run } = makeEditor();
    const onFinishEditing = jest.fn();
    render(
      <TextBlockView
        selected={true}
        attributes={{} as any}
        setNodeRef={() => {}}
        containerRef={{ current: null }}
        isDragging={false}
        style={{}}
        guides={{ x: null, y: null }}
        snapping={false}
        editor={editor}
        editing={true}
        onStartEditing={() => {}}
        onFinishEditing={onFinishEditing}
        startDrag={() => {}}
        startResize={() => {}}
        onSelect={() => {}}
        onRemove={() => {}}
        content="Hello"
      />
    );
    const host = screen.getByRole("listitem");
    // Keydown is attached to mocked EditorContent node
    const editable = host.querySelector('[data-ec]') as HTMLElement | null;
    fireEvent.keyDown(editable || host, { key: "Enter" });
    expect(onFinishEditing).toHaveBeenCalled();
    fireEvent.keyDown(editable || host, { key: "u", ctrlKey: true });
    expect(run).toHaveBeenCalled();
  });
});
