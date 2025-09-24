jest.mock("../src/components/cms/page-builder/scrollEffects", () => ({
  ensureScrollStyles: jest.fn(),
  ensureAnimationStyles: jest.fn(),
  initScrollEffects: jest.fn(),
}));
jest.mock("../src/components/cms/page-builder/timeline", () => ({
  initTimelines: jest.fn(),
}));
jest.mock("../src/components/cms/page-builder/lottie", () => ({
  initLottie: jest.fn(),
}));
jest.mock("../src/components/cms/lightbox", () => ({
  ensureLightboxStyles: jest.fn(),
  initLightbox: jest.fn(),
}));

import React from "react";
import { render } from "@testing-library/react";
import DynamicRenderer from "../src/components/DynamicRenderer";
import { blockRegistry } from "../src/components/cms/blocks";
import type { PageComponent } from "@acme/types";

describe("DynamicRenderer className merge and sticky variants", () => {
  it("merges existing className with stackClass", () => {
    const spy = jest
      .spyOn(blockRegistry.Text, "component")
      .mockImplementation(() => <div />);
    const components: PageComponent[] = [
      {
        id: "m",
        type: "Text",
        text: { en: "x" },
        className: "existing",
        stackStrategy: "reverse",
      } as any,
    ];
    render(<DynamicRenderer components={components} locale="en" />);
    expect(spy).toHaveBeenCalled();
    const passed = spy.mock.calls[0][0];
    expect(passed.className).toContain("existing");
    expect(passed.className).toContain("pb-stack-mobile-reverse");
    spy.mockRestore();
  });

  it("supports sticky bottom and an additional animation variant", () => {
    const spy = jest
      .spyOn(blockRegistry.Text, "component")
      .mockImplementation(() => <div />);
    const components: PageComponent[] = [
      {
        id: "s",
        type: "Text",
        text: { en: "y" },
        sticky: "bottom",
        animation: "slide-left",
        animationDuration: 120,
      } as any,
    ];
    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.dataset.pbSticky).toBe("bottom");
    expect(wrapper.className).toMatch(/pb-animate/);
    expect(wrapper.style.getPropertyValue("--pb-anim-duration")).toBe("120ms");
    spy.mockRestore();
  });
});
