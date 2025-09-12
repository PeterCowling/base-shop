import "../../../../../test/resetNextMocks";
import { jest } from "@jest/globals";
import { render, fireEvent } from "@testing-library/react";
import { ARViewer } from "./ARViewer";

describe("ARViewer", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads model URL and renders viewer", () => {
    jest.spyOn(customElements, "get").mockReturnValue({} as any);
    const { container, unmount } = render(<ARViewer src="model.glb" />);
    const viewer = container.querySelector("model-viewer");
    expect(viewer).not.toBeNull();
    expect(viewer?.getAttribute("src")).toBe("model.glb");
    unmount();
  });

  it("displays fallback on error", () => {
    jest.spyOn(customElements, "get").mockReturnValue({} as any);
    const { container, getByText, unmount } = render(
      <ARViewer src="bad.glb">
        <div>Fallback</div>
      </ARViewer>
    );
    const viewer = container.querySelector("model-viewer")!;
    viewer.dispatchEvent(new Event("error", { bubbles: true }));
    expect(getByText("Fallback")).toBeInTheDocument();
    unmount();
  });

  it("emits load events", () => {
    jest.spyOn(customElements, "get").mockReturnValue({} as any);
    const { container, unmount } = render(<ARViewer src="model.glb" />);
    const viewer = container.querySelector("model-viewer")!;
    const handler = jest.fn();
    viewer.addEventListener("load", handler);
    viewer.dispatchEvent(new Event("load"));
    expect(handler).toHaveBeenCalled();
    unmount();
  });
});

