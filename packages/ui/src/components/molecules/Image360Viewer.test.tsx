import "../../../../../test/resetNextMocks";
import { fireEvent, render, screen } from "@testing-library/react";
import { Image360Viewer } from "./Image360Viewer";

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

describe("Image360Viewer", () => {
  it("rotates through frames on drag and halts after pointer release", () => {
    const frames = ["/1.jpg", "/2.jpg", "/3.jpg"];
    render(<Image360Viewer frames={frames} alt="viewer" />);
    const img = screen.getByAltText("viewer");
    const container = img.closest("div") as HTMLElement;

    // Moving without pressing shouldn't change the frame
    fireEvent.pointerMove(container, { clientX: 50 });
    expect(img).toHaveAttribute("src", frames[0]);

    // Press and move slightly below threshold
    fireEvent.pointerDown(container, { clientX: 100 });
    fireEvent.pointerMove(container, { clientX: 105 });
    expect(img).toHaveAttribute("src", frames[0]);

    // Drag right far enough to wrap to the last frame
    fireEvent.pointerMove(container, { clientX: 112 });
    expect(img).toHaveAttribute("src", frames[2]);

    // Drag left to advance to the next frame
    fireEvent.pointerMove(container, { clientX: 90 });
    expect(img).toHaveAttribute("src", frames[0]);

    // Releasing the pointer resets movement tracking
    fireEvent.pointerUp(container);
    fireEvent.pointerMove(container, { clientX: 200 });
    expect(img).toHaveAttribute("src", frames[0]);
  });
});

