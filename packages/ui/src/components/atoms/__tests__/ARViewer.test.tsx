import "../../../../../../test/resetNextMocks";
import { jest } from "@jest/globals";
import { render } from "@testing-library/react";
import { ARViewer } from "../ARViewer";

const scriptSrc = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

describe("ARViewer", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("injects script when model-viewer is undefined", () => {
    jest.spyOn(customElements, "get").mockReturnValue(undefined);

    const { unmount } = render(<ARViewer src="model.glb" />);

    expect(document.head.querySelector(`script[src="${scriptSrc}"]`)).not.toBeNull();

    unmount();
  });

  it("does not inject script when model-viewer already exists", () => {
    jest.spyOn(customElements, "get").mockReturnValue({} as any);

    const { unmount } = render(<ARViewer src="model.glb" />);

    expect(document.head.querySelector(`script[src="${scriptSrc}"]`)).toBeNull();

    unmount();
  });
});

