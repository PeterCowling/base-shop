import React from "react";
import { cleanup,render } from "@testing-library/react";

import { ARViewer } from "../src/components/atoms/ARViewer";

const scriptSrc = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

describe("ARViewer", () => {
  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
    // Clean up any injected scripts for test isolation
    const existing = document.head.querySelector(`script[src="${scriptSrc}"]`);
    if (existing) {
      document.head.removeChild(existing);
    }
  });

  it("injects model-viewer script on mount when not present", () => {
    jest.spyOn(customElements, "get").mockReturnValue(undefined);
    const appendChildSpy = jest.spyOn(document.head, "appendChild");

    const { unmount } = render(<ARViewer src="/3d.glb" />);

    expect(appendChildSpy).toHaveBeenCalled();
    const scriptEl = appendChildSpy.mock.calls[0][0] as HTMLScriptElement;
    expect(scriptEl.tagName).toBe("SCRIPT");
    expect(scriptEl.getAttribute("src")).toBe(scriptSrc);

    unmount();
  });

  it("does not inject script when custom element already defined", () => {
    jest.spyOn(customElements, "get").mockReturnValue({} as any);

    const { unmount } = render(<ARViewer src="/3d.glb" />);
    expect(document.head.querySelector(`script[src="${scriptSrc}"]`)).toBeNull();

    unmount();
  });
});

