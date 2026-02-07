import React from "react";
import { render, screen } from "@testing-library/react";

import TextBlockView from "../TextBlockView";

jest.mock("../MenuBar", () => ({ __esModule: true, default: () => <div /> }));
jest.mock("../LinkPicker", () => ({ __esModule: true, default: () => <div /> }));

describe("TextBlockView sanitize", () => {
  it("strips inline event handlers from HTML content", () => {
    const html = '<a href="#" onclick="alert(1)">Click</a>';
    render(
      <TextBlockView
        selected={false}
        attributes={{} as any}
        setNodeRef={() => {}}
        containerRef={{ current: null }}
        isDragging={false}
        style={{}}
        guides={{ x: null, y: null }}
        snapping={false}
        editor={null}
        editing={false}
        onStartEditing={() => {}}
        onFinishEditing={() => {}}
        startDrag={() => {}}
        startResize={() => {}}
        onSelect={() => {}}
        onRemove={() => {}}
        content={html}
      />
    );
    const container = screen.getByRole("listitem");
    expect(container.innerHTML).toContain("Click");
    expect(container.innerHTML).not.toContain("onclick");
  });
});

