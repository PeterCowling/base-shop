import React from "react";
import { render } from "@testing-library/react";

import type { PageComponent } from "@acme/types";

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

describe("DynamicRenderer animation invalid value", () => {
  it("does not add pb-animate class when animation not allowed", () => {
    const components: PageComponent[] = [
      { id: "x", type: "Text", text: { en: "x" }, animation: "fade-in" } as any,
    ];
    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).not.toMatch(/pb-animate/);
  });
});

