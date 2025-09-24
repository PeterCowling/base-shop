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
import type { PageComponent } from "@acme/types";

describe("DynamicRenderer timeline present and sticky top", () => {
  it("sets data-pb-timeline when steps exist and sticky='top'", () => {
    const components: PageComponent[] = [
      {
        id: "tl",
        type: "Text",
        text: { en: "x" },
        sticky: "top",
        timeline: { steps: [{ at: 0, to: { opacity: 1 } }] },
        staggerChildren: 3,
      } as any,
    ];
    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.dataset.pbSticky).toBe("top");
    expect(wrapper.dataset.pbTimeline).toContain("steps");
    expect(wrapper.dataset.pbStagger).toBe("3");
  });
});

