import "../../../../../../test/resetNextMocks";

import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { Image360Viewer } from "../Image360Viewer";

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

describe("Image360Viewer", () => {
  it("changes frames when dragging horizontally and wraps index", async () => {
    const frames = ["/1.jpg", "/2.jpg"];
    render(<Image360Viewer frames={frames} alt="test" />);
    const img = screen.getByAltText("test");
    const container = img.closest("div") as HTMLElement;

    expect(img).toHaveAttribute("src", frames[0]);

    fireEvent.pointerDown(container, { clientX: 100 });
    fireEvent.pointerMove(container, { clientX: 111 });
    expect(img).toHaveAttribute("src", frames[1]);

    fireEvent.pointerMove(container, { clientX: 100 });
    expect(img).toHaveAttribute("src", frames[0]);
  });

  it("does not change on tiny moves and stops after pointer up/leave", () => {
    const frames = ["/1.jpg", "/2.jpg", "/3.jpg"];
    render(<Image360Viewer frames={frames} />);
    const img = screen.getByAltText("");
    const container = img.closest("div") as HTMLElement;

    // Small movement below threshold should not change frame
    expect(img).toHaveAttribute("src", frames[0]);
    fireEvent.pointerDown(container, { clientX: 100 });
    fireEvent.pointerMove(container, { clientX: 108 });
    expect(img).toHaveAttribute("src", frames[0]);

    // Cross threshold to advance one frame (right drag -> previous index)
    fireEvent.pointerMove(container, { clientX: 121 });
    expect(img).toHaveAttribute("src", frames[2]);

    // Pointer up should stop tracking further moves
    fireEvent.pointerUp(container);
    fireEvent.pointerMove(container, { clientX: 140 });
    expect(img).toHaveAttribute("src", frames[2]);

    // Pointer leave also resets tracking
    fireEvent.pointerDown(container, { clientX: 200 });
    fireEvent.pointerLeave(container);
    fireEvent.pointerMove(container, { clientX: 220 });
    expect(img).toHaveAttribute("src", frames[2]);
  });
});
