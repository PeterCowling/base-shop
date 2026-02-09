import "../../../../../../test/resetNextMocks";

import { jest } from "@jest/globals";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";

import { ARViewer } from "../ARViewer";

const scriptSrc = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

describe("ARViewer", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    const existing = document.head.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) {
      document.head.removeChild(existing);
    }
  });

  it("injects script once when model-viewer is undefined", async () => {
    jest.spyOn(customElements, "get").mockReturnValue(undefined);
    const appendChildSpy = jest.spyOn(document.head, "appendChild");

    const { container,  unmount } = render(<ARViewer src="model.glb" />);

    expect(appendChildSpy).toHaveBeenCalledTimes(1);

    const scriptEl = appendChildSpy.mock.calls[0][0] as HTMLScriptElement;
    expect(scriptEl.tagName).toBe("SCRIPT");
    expect(scriptEl.getAttribute("src")).toBe(scriptSrc);
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
