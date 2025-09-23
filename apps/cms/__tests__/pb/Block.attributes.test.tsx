import React from "react";
import { render, screen } from "@testing-library/react";

// Mock block registry to a minimal set
jest.mock(require.resolve("@ui/components/cms/blocks"), () => ({
  __esModule: true,
  blockRegistry: {
    Hero: { component: (props: any) => <div data-cy="hero" {...props} /> },
  },
}));

// No-op side effects
jest.mock(require.resolve("@ui/components/cms/page-builder/scrollEffects"), () => ({ __esModule: true, ensureScrollStyles: () => {} }));
jest.mock(require.resolve("@ui/components/cms/page-builder/timeline"), () => ({ __esModule: true, initTimelines: () => {} }));
jest.mock(require.resolve("@ui/components/cms/page-builder/lottie"), () => ({ __esModule: true, initLottie: () => {} }));

// Control cssVars to return stable mapping
const cssVarsMap = {
  "--pb-static-transform": "scale(1.5)",
  "--pb-anim-duration": "250ms",
};
jest.mock(require.resolve("@ui/components/cms/utils/style/cssVars"), () => ({ __esModule: true, cssVars: () => ({ ...cssVarsMap }) }));

import Block from "@ui/components/cms/page-builder/Block";

describe("Block (attributes)", () => {
  it("wraps non-Button with animation, data attrs, grid props and style vars", () => {
    render(
      <Block
        locale="en" as any
        component={{
          id: "h1",
          type: "Hero",
          clickAction: "navigate",
          href: "/x",
          animation: "slide-up",
          animationDuration: 300,
          animationDelay: 50,
          animationEasing: "ease-out",
          reveal: "fade",
          parallax: 0.2,
          sticky: "top",
          stickyOffset: 8,
          hoverScale: 1.1,
          hoverOpacity: 0.9,
          staggerChildren: 120,
          timeline: { steps: [{ at: 0, to: { o: 1 } }] },
          lottieUrl: "/anim.json",
          lottieAutoplay: true,
          lottieLoop: true,
          lottieSpeed: 1.5,
          lottieTrigger: "visible",
          gridArea: "1/1/2/2",
          gridColumn: "1 / span 2",
          gridRow: "auto",
          styles: JSON.stringify({ some: "override" }),
        } as any}
      />
    );
    const wrap = screen.getByTestId("hero").closest(".pb-hover-target")?.parentElement as HTMLElement;
    expect(wrap).toBeTruthy();
    // Animation classes
    expect(wrap.className).toMatch(/pb-animate/);
    expect(wrap.className).toMatch(/pb-animate-slide-up/);
    // Data attributes
    expect(wrap).toHaveAttribute("data-pb-duration", "300");
    expect(wrap).toHaveAttribute("data-pb-delay", "50");
    expect(wrap).toHaveAttribute("data-pb-ease", "ease-out");
    expect(wrap).toHaveAttribute("data-pb-reveal", "fade");
    expect(wrap).toHaveAttribute("data-pb-parallax", "0.2");
    expect(wrap).toHaveAttribute("data-pb-sticky", "top");
    expect(wrap).toHaveAttribute("data-pb-sticky-offset", "8");
    expect(wrap).toHaveAttribute("data-pb-href", "/x");
    expect(wrap).toHaveAttribute("data-pb-stagger", "120");
    expect(wrap).toHaveAttribute("data-pb-timeline");
    expect(wrap).toHaveAttribute("data-pb-lottie-url", "/anim.json");
    expect(wrap).toHaveAttribute("data-pb-lottie-autoplay", "1");
    expect(wrap).toHaveAttribute("data-pb-lottie-loop", "1");
    expect(wrap).toHaveAttribute("data-pb-lottie-speed", "1.5");
    expect(wrap).toHaveAttribute("data-pb-lottie-trigger", "visible");
    // Style variables
    const style = wrap.getAttribute("style") ?? "";
    expect(style).toMatch("--pb-sticky-offset: 8px");
    expect(style).toMatch("--pb-hover-scale: 1.1");
    expect(style).toMatch("--pb-hover-opacity: 0.9");
    expect(style).toMatch("grid-area: 1/1/2/2");
    expect(style).toMatch("grid-column: 1 / span 2");
    expect(style).toMatch("grid-row: auto");
    // Link wrapper present
    const link = wrap.querySelector("a[href='/x']");
    expect(link).toBeTruthy();
  });

  it("applies static transform wrapper when provided and no hover effects", () => {
    // Re-mock cssVars to only include static transform
    jest.isolateModules(() => {
      jest.doMock(require.resolve("@ui/components/cms/utils/style/cssVars"), () => ({ __esModule: true, cssVars: () => ({ "--pb-static-transform": "rotate(10deg)" }) }));
      const B = require("@ui/components/cms/page-builder/Block").default as typeof Block;
      render(
        <B
          locale="en" as any
          component={{ id: "h2", type: "Hero", styles: JSON.stringify({}) } as any}
        />
      );
      const inner = screen.getByTestId("hero").previousElementSibling as HTMLElement;
      expect(inner.tagName.toLowerCase()).toBe("div");
      expect(inner.getAttribute("style") ?? "").toMatch("transform: rotate(10deg)");
    });
  });

  it("ignores invalid style JSON without throwing", () => {
    render(<Block locale="en" as any component={{ id: "t1", type: "Text", styles: "{invalid" } as any} />);
    expect(screen.getByText("" + "")).toBeInTheDocument();
  });
});

