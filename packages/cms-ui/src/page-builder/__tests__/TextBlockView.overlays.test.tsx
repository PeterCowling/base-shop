import React from "react";
import { render } from "@testing-library/react";

import TextBlockView from "../TextBlockView";

jest.mock("../MenuBar", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("../LinkPicker", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("@tiptap/react", () => ({ __esModule: true, EditorContent: (p: any) => <div data-ec {...p} /> }));

describe("TextBlockView overlays", () => {
  it("renders spacing, kb resize and rotation overlays when props enabled", () => {
    const { container } = render(
      <TextBlockView
        selected={true}
        attributes={{} as any}
        setNodeRef={() => {}}
        containerRef={{ current: null }}
        isDragging={false}
        style={{}}
        guides={{ x: 10, y: 20 }}
        snapping={true}
        editor={null}
        editing={false}
        onStartEditing={() => {}}
        onFinishEditing={() => {}}
        startDrag={() => {}}
        startResize={() => {}}
        onSelect={() => {}}
        onRemove={() => {}}
        content="Hello"
        kbResizing={true}
        rotating={true}
        rotateAngle={42}
        spacingOverlay={{ type: "margin", side: "top", top: 1, left: 2, width: 3, height: 4 }}
      />
    );
    // Spacing overlay box exists (match via inline style and class fragment)
    const overlay = Array.from(container.querySelectorAll("div")).find((el) => el.className.includes("bg-primary") && el.className.includes("pointer-events-none") && el.getAttribute("style")?.includes("width: 3px"));
    expect(overlay).toBeTruthy();
    // KB resize indicator and rotation indicator exist
    expect(container.textContent).toMatch(/42°/);
  });
});
