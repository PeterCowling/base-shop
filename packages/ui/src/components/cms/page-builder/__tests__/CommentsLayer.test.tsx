import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentsLayer from "../CommentsLayer";

// Mock next-auth session
jest.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { name: "Tester", email: "t@example.com" } } }) }));
// Mock presence
jest.mock("../collab/usePresence", () => ({ __esModule: true, default: () => ({ peers: [{ id: "p1", label: "Alice", color: "var(--color-success)" }] }) }));
// Mock comments API
const api = {
  loadThreads: jest.fn(async () => [
    { id: "t1", componentId: "c1", resolved: false, assignedTo: null, messages: [{ id: "m1", text: "hi", ts: new Date().toISOString() }] },
    { id: "t2", componentId: "c2", resolved: true, assignedTo: "bob", messages: [{ id: "m2", text: "done", ts: new Date().toISOString() }] },
  ]),
  patchThread: jest.fn(async () => {}),
  deleteThread: jest.fn(async () => {}),
  createThread: jest.fn(async (componentId: string, text: string) => ({ ok: true, json: { id: `new_${componentId}` } })),
};
jest.mock("../comments/useCommentsApi", () => ({ useCommentsApi: () => api }));

// Keep the pins layer light but clickable
jest.mock("../comments/CommentsPinsLayer", () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <div data-cy="visible-count">{props.visibleThreads?.length ?? 0}</div>
      <button data-cy="pin-open" onClick={() => props.onOpen("t1")}>open</button>
      <button data-cy="pin-drag" onMouseDown={() => props.onStartDrag("t1")}>drag</button>
    </div>
  ),
}));

// Light toolbar stub exposes actions
jest.mock("../comments/CommentsToolbar", () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <button onClick={props.onToggleDrawer}>Comments ({props.unresolvedCount})</button>
      <button onClick={() => props.onShowResolvedChange(!props.showResolved)}>toggle-resolved</button>
      <button onClick={() => props.onReload()}>reload</button>
      <button onClick={() => props.onAddForSelected()} disabled={!props.canAddForSelected}>add-for-selected</button>
    </div>
  ),
}));

// Drawer stub calls through props for core actions
jest.mock("../CommentsDrawer", () => ({
  __esModule: true,
  default: (props: any) => (
    <div>
      <div data-cy="drawer" data-open={props.open} />
      <button onClick={() => props.onSelect(props.threads[0]?.id)}>select-first</button>
      <button onClick={() => props.onAddMessage("t1", "reply")}>add-msg</button>
      <button onClick={() => props.onToggleResolved("t1", true)}>toggle-resolved</button>
      <button onClick={() => props.onAssign("t1", "alice")}>assign</button>
      <button onClick={() => props.onDelete("t1")}>delete</button>
      <button onClick={() => props.onCreate("c1", "new", null)}>create</button>
      <button onClick={() => props.onJumpTo("c1")}>jump</button>
    </div>
  ),
}));

// Undo toast – expose restore
jest.mock("../comments/UndoToast", () => ({ __esModule: true, default: (p: any) => (<button onClick={() => p.onRestore?.()} data-testid="undo">undo</button>) }));

describe("CommentsLayer", () => {
  function setup() {
    const canvas = document.createElement("div");
    const c1 = document.createElement("div"); c1.setAttribute("data-component-id", "c1");
    const c2 = document.createElement("div"); c2.setAttribute("data-component-id", "c2");
    Object.assign(canvas, {
      querySelector: (sel: string) => (sel.includes("c1") ? c1 : sel.includes("c2") ? c2 : null),
      querySelectorAll: (sel: string) => {
        if (sel.includes("[data-component-id]")) {
          // Minimal NodeList-like
          return [c1, c2] as any;
        }
        return [] as any;
      },
    });
    const rect = { left: 0, top: 0, x: 0, y: 0, right: 200, bottom: 200, width: 200, height: 200, toJSON: () => ({}) } as any;
    (canvas as any).getBoundingClientRect = () => rect;
    (c1 as any).getBoundingClientRect = () => ({ ...rect, left: 0, top: 0, width: 100, height: 100 });
    (c2 as any).getBoundingClientRect = () => ({ ...rect, left: 100, top: 0, width: 100, height: 100 });
    (c1 as any).scrollIntoView = jest.fn();
    const canvasRef = { current: canvas } as React.RefObject<HTMLDivElement>;
    const components = [{ id: "c1", type: "Text" }, { id: "c2", type: "Text" }] as any;
    return { canvasRef, components };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads threads, toggles drawer, adds for selected, deletes, restores, and jumps", async () => {
    const { canvasRef, components } = setup();
    const user = userEvent.setup();
    render(
      <CommentsLayer
        canvasRef={canvasRef}
        components={components}
        shop="shop-1"
        pageId="p1"
        selectedIds={["c1"]}
      />
    );

    // loadThreads called and unresolved count reflects visible set
    expect(api.loadThreads).toHaveBeenCalled();
    expect(screen.getByText(/Comments \(/)).toBeInTheDocument();

    // Toggle drawer
    await user.click(screen.getByText(/Comments \(/));
    expect(screen.getByTestId("drawer").getAttribute("data-open")).toBe("true");

    // Toolbar actions
    // Initially showResolved = true -> visible threads include resolved and unresolved
    expect(screen.getByTestId("visible-count")).toHaveTextContent("2");
    await user.click(screen.getAllByText("toggle-resolved")[0]);
    // Now only unresolved are visible
    expect(screen.getByTestId("visible-count")).toHaveTextContent("1");
    await user.click(screen.getByText("reload"));
    expect(api.loadThreads).toHaveBeenCalledTimes(2);

    // Add for selected -> createThread called and drawer stays open
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue("new thread");
    await user.click(screen.getByText("add-for-selected"));
    expect(api.createThread).toHaveBeenCalledWith("c1", expect.any(String));

    // Drawer actions propagate to API
    await user.click(screen.getByText("add-msg"));
    expect(api.patchThread).toHaveBeenCalledWith("t1", expect.objectContaining({ action: "addMessage" }));
    await user.click(screen.getAllByText("toggle-resolved")[1]);
    expect(api.patchThread).toHaveBeenCalledWith("t1", { resolved: true });
    await user.click(screen.getByText("assign"));
    expect(api.patchThread).toHaveBeenCalledWith("t1", { assignedTo: "alice" });

    // Delete then restore
    await user.click(screen.getByText("delete"));
    expect(api.deleteThread).toHaveBeenCalledWith("t1");
    await user.click(screen.getByText("undo"));
    // Restore re-creates and replays messages/resolved status
    expect(api.createThread).toHaveBeenCalled();

    // Select first thread and jump to component -> scrollIntoView called
    await user.click(screen.getByText("select-first"));
    await user.click(screen.getByText("jump"));
    // The setup hooks into c1.scrollIntoView
    const canvas = canvasRef.current!;
    const el = canvas.querySelector('[data-component-id="c1"]') as any;
    expect(el.scrollIntoView).toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it("handles load error and recovers on reload", async () => {
    const { canvasRef, components } = setup();
    const user = userEvent.setup();
    // First call fails, second returns 1 unresolved
    api.loadThreads.mockRejectedValueOnce(new Error("fail"));
    api.loadThreads.mockResolvedValueOnce([
      { id: "t3", componentId: "c1", resolved: false, assignedTo: null, messages: [{ id: "m1", text: "hi", ts: new Date().toISOString() }] },
    ] as any);

    render(
      <CommentsLayer
        canvasRef={canvasRef}
        components={components}
        shop="shop-1"
        pageId="p1"
        selectedIds={["c1"]}
      />
    );

    // After failing load, unresolved count is 0 until reload
    expect(screen.getByText(/Comments \(0\)/)).toBeInTheDocument();
    await user.click(screen.getByText("reload"));
    expect(screen.getByText(/Comments \(1\)/)).toBeInTheDocument();
  });

  it("drags a pin and patches with normalized position", async () => {
    const { canvasRef, components } = setup();
    render(
      <CommentsLayer
        canvasRef={canvasRef}
        components={components}
        shop="shop-1"
        pageId="p1"
        selectedIds={["c1"]}
      />
    );

    // Ensure pins layer rendered and threads loaded
    await screen.findByTestId("visible-count");
    // Begin dragging the first pin
    const dragBtn = await screen.findByTestId("pin-drag");
    await act(async () => {
      dragBtn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });

    // Move cursor to center of c1 (0.5, 0.5) and release
    await act(async () => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 50, clientY: 50 }));
    });
    // Trigger a second move after state/effect cycle so the listener with updated dragId runs
    await act(async () => {
      await Promise.resolve();
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 50, clientY: 50 }));
    });
    await act(async () => {
      window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });

    expect(api.patchThread).toHaveBeenCalledWith("t1", { pos: { x: 0.5, y: 0.5 } });
  });

  it("drag cancel without move does not patch", async () => {
    const { canvasRef, components } = setup();
    render(
      <CommentsLayer
        canvasRef={canvasRef}
        components={components}
        shop="shop-1"
        pageId="p1"
        selectedIds={["c1"]}
      />
    );
    await screen.findByTestId("visible-count");
    const dragBtn = await screen.findByTestId("pin-drag");
    await act(async () => {
      dragBtn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    await act(async () => {
      // No move; immediately mouseup
      window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });
    expect(api.patchThread).not.toHaveBeenCalled();
  });

  it("patch rejection leaves threads unchanged and does not reload", async () => {
    const { canvasRef, components } = setup();
    api.patchThread.mockRejectedValueOnce(new Error("fail"));
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(
      <CommentsLayer
        canvasRef={canvasRef}
        components={components}
        shop="shop-1"
        pageId="p1"
        selectedIds={["c1"]}
      />
    );
    await screen.findByTestId("visible-count");
    const dragBtn = await screen.findByTestId("pin-drag");
    await act(async () => {
      dragBtn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    });
    await act(async () => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 50, clientY: 50 }));
    });
    await act(async () => {
      window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    });
    expect(api.patchThread).toHaveBeenCalled();
    // loadThreads should not be called extra due to rejection (initial load already called once in setup)
    expect(api.loadThreads).toHaveBeenCalledTimes(1);
    errSpy.mockRestore();
  });
});
