import "../../../../../../test/resetNextMocks";
import { fireEvent, render, screen } from "@testing-library/react";
import { Image360Viewer } from "../Image360Viewer";

// jsdom may not define PointerEvent
if (typeof window !== "undefined" && !(window as any).PointerEvent) {
  (window as any).PointerEvent = MouseEvent as any;
}

describe("Image360Viewer", () => {
  it("changes frames when dragging horizontally and wraps index", () => {
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
});
