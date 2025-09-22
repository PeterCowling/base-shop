import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentsPinsLayer from "../comments/CommentsPinsLayer";

describe("CommentsPinsLayer", () => {
  it("renders pins at relative positions and badges per component", async () => {
    const user = userEvent.setup();
    const positionsRef = { current: {
      c1: { left: 0, top: 0, width: 100, height: 100 },
      c2: { left: 100, top: 0, width: 100, height: 100 },
    } } as any;
    const threads = [
      { id: "t1", componentId: "c1", resolved: false, messages: [], pos: { x: 0.5, y: 0.5 } },
      { id: "t2", componentId: "c1", resolved: true, messages: [] },
      { id: "t3", componentId: "c2", resolved: false, messages: [], pos: { x: 0.2, y: 0.1 } },
    ] as any;
    const visible = threads.filter((t: any) => !t.resolved);
    const onStartDrag = jest.fn();
    const onOpen = jest.fn();

    render(
      <div style={{ position: "relative" }}>
        <CommentsPinsLayer
          threads={threads}
          visibleThreads={visible}
          positionsRef={positionsRef}
          dragId={null}
          dragPos={null}
          onStartDrag={onStartDrag}
          onOpen={onOpen}
        />
      </div>
    );

    // Two visible pins (for t1 and t3)
    const pins = screen.getAllByRole("button");
    expect(pins).toHaveLength(2);
    // Click to open and mousedown to drag
    await user.click(pins[0]);
    expect(onOpen).toHaveBeenCalled();
    await user.pointer({ keys: "[MouseLeft]", target: pins[0] });
    expect(onStartDrag).toHaveBeenCalled();
    // Two badges for unresolved counts (one per component with unresolved)
    // They are divs with title attribute
    const badges = document.querySelectorAll('[title*="unresolved comments"]');
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });
});

