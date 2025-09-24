import React from "react";
import { render, cleanup } from "@testing-library/react";
import { ARViewer } from "../src/components/atoms/ARViewer";

describe("ARViewer", () => {
  afterEach(() => cleanup());

  it("injects model-viewer script on mount and removes on unmount when not present", () => {
    const getOrig = customElements.get;
    (customElements as any).get = jest.fn(() => undefined);
    const headCount = () => document.head.querySelectorAll("script[src*='model-viewer']").length;
    expect(headCount()).toBe(0);
    const { unmount } = render(<ARViewer src="/3d.glb" />);
    expect(headCount()).toBe(1);
    unmount();
    expect(headCount()).toBe(0);
    (customElements as any).get = getOrig;
  });

  it("does not inject script when custom element already defined", () => {
    const getOrig = customElements.get;
    (customElements as any).get = jest.fn(() => ({}));
    const headCount = () => document.head.querySelectorAll("script[src*='model-viewer']").length;
    const { unmount } = render(<ARViewer src="/3d.glb" />);
    expect(headCount()).toBe(0);
    unmount();
    (customElements as any).get = getOrig;
  });
});

