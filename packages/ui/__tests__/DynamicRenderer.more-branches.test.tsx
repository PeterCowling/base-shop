import { render } from "@testing-library/react";

import type { PageComponent } from "@acme/types";

import { blockRegistry } from "../src/components/cms/blocks";
import DynamicRenderer from "../src/components/DynamicRenderer";

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

describe("DynamicRenderer additional branches", () => {
  it("passes stackStrategy reverse as className to block component and adds orderMobile class to wrapper", () => {
    const spy = jest
      .spyOn(blockRegistry.Text as any, "component")
      .mockImplementation(({ className }: any) => (
        <div data-cy="comp" className={className} />
      ));

    const components: PageComponent[] = [
      {
        id: "a",
        type: "Text",
        text: { en: "x" },
        // only orderMobile creates a wrapper class
        orderMobile: 3,
        // stackStrategy should be forwarded to child's className
        stackStrategy: "reverse",
      } as any,
    ];

    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toMatch(/pb-order-mobile-3/);
    expect(spy).toHaveBeenCalled();
    const passed = spy.mock.calls[0]?.[0] as { className?: string } | undefined;
    expect(passed?.className).toContain("pb-stack-mobile-reverse");
    spy.mockRestore();
  });

  it("uses static transform wrapper when only static transform is present (no hover)", () => {
    const spy = jest
      .spyOn(blockRegistry.Text as any, "component")
      .mockImplementation(() => <div data-cy="inner" />);

    const styles = JSON.stringify({ effects: { transformRotate: "10deg" } });
    const components: PageComponent[] = [
      {
        id: "b",
        type: "Text",
        text: { en: "x" },
        styles,
      } as any,
    ];

    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );
    // structure: wrapper -> transform wrapper -> component
    const wrapper = container.firstElementChild as HTMLElement;
    const transformWrapper = wrapper.firstElementChild as HTMLElement;
    expect(transformWrapper.style.transform).toContain("rotate(10deg)");
    spy.mockRestore();
  });

  it("sets clickAction scroll-to and omits timeline when steps empty; hoverOpacity alone creates hover target", () => {
    const spy = jest
      .spyOn(blockRegistry.Text as any, "component")
      .mockImplementation(() => <div data-cy="c" />);

    const components: PageComponent[] = [
      {
        id: "c",
        type: "Text",
        text: { en: "x" },
        clickAction: "scroll-to",
        timeline: { steps: [] },
        hoverOpacity: 0.8,
      } as any,
    ];

    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.dataset.pbClick).toBe("scroll-to");
    expect(wrapper.dataset.pbTimeline).toBeUndefined();
    // hoverOpacity triggers pb-hover-target wrapper
    const hoverTarget = wrapper.firstElementChild as HTMLElement;
    expect(hoverTarget).toHaveClass("pb-hover-target");
    spy.mockRestore();
  });
});
