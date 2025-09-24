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

describe("DynamicRenderer animations and typography vars", () => {
  const variants = [
    "fade",
    "slide",
    "slide-up",
    "slide-down",
    "slide-left",
    "slide-right",
    "zoom",
    "rotate",
  ] as const;

  it.each(variants)("adds pb-animate class for %s", (animation) => {
    const components: PageComponent[] = [
      { id: animation, type: "Text", text: { en: "x" }, animation } as any,
    ];
    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toMatch(/pb-animate/);
  });

  it("supports string stickyOffset and maps typography vars to computed font styles", () => {
    const styles = JSON.stringify({
      typography: { fontFamily: "--font-base" },
      typographyMobile: { fontSize: "--fs-m", lineHeight: "--lh-m" },
    });
    const components: PageComponent[] = [
      {
        id: "t",
        type: "Text",
        text: { en: "x" },
        styles,
        stickyOffset: "2rem",
      } as any,
    ];
    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.dataset.pbStickyOffset).toBe("2rem");
    expect(wrapper.style.fontFamily).toBe("var(--font-family)");
    // Underlying custom properties exist on the element from cssVars
    expect(wrapper.style.getPropertyValue("--font-size-mobile")).toBe("var(--fs-m)");
    expect(wrapper.style.getPropertyValue("--line-height-mobile")).toBe("var(--lh-m)");
  });
});
