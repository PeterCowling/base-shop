import { render } from "@testing-library/react";
import { ARViewer } from "../components/atoms/ARViewer";

const scriptSrc =
  "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

describe("ARViewer", () => {
  it("adds script to head on mount and removes on unmount", () => {
    const { unmount } = render(<ARViewer src="model.glb" />);

    const script = document.head.querySelector(`script[src="${scriptSrc}"]`);
    expect(script).not.toBeNull();

    unmount();
    expect(
      document.head.querySelector(`script[src="${scriptSrc}"]`)
    ).toBeNull();
  });

  it("passes src and class names to model-viewer", () => {
    const { container } = render(
      <ARViewer src="model.glb" className="foo bar" />
    );

    const modelViewer = container.querySelector("model-viewer") as HTMLElement;
    expect(modelViewer).toBeInTheDocument();
    expect(modelViewer).toHaveAttribute("src", "model.glb");
    expect(modelViewer).toHaveClass("h-full", "w-full", "foo", "bar");
  });
});
