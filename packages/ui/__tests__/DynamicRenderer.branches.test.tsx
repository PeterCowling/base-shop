// Focused branch coverage for DynamicRenderer
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

import { render, screen } from "@testing-library/react";
import DynamicRenderer from "../src/components/DynamicRenderer";
import { blockRegistry } from "../src/components/cms/blocks";
import type { PageComponent } from "@acme/types";

describe("DynamicRenderer branchy paths", () => {
  it("skips blocks marked hidden", () => {
    const components = [
      { id: "1", type: "Text", hidden: true, text: { en: "x" } } as any,
    ];
    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );
    // No children rendered
    expect(container).toBeEmptyDOMElement();
  });

  it("handles invalid styles JSON gracefully (catch path)", () => {
    const components = [
      { id: "1", type: "Text", styles: "{invalid json", text: { en: "t" } } as any,
    ];
    expect(() =>
      render(<DynamicRenderer components={components} locale="en" />)
    ).not.toThrow();
  });

  it("applies classes, dataset, hover/static transform, grid and zIndex", () => {
    const spy = jest
      .spyOn(blockRegistry.Text, "component")
      .mockImplementation(({ children }: any) => <div data-cy="inner">{children}</div>);

    const id = "blk1";
    const styles = JSON.stringify({
      effects: { transformRotate: "10deg" },
      typography: { fontFamily: "--font-family" },
    });
    const child: PageComponent = { id: "c1", type: "Text", text: { en: "child" } } as any;
    const components: PageComponent[] = [
      {
        id,
        type: "Text",
        text: { en: "root" },
        zIndex: 5,
        styles,
        hiddenBreakpoints: ["mobile"],
        hoverScale: 1.2,
        gridArea: "a",
        gridColumn: "1 / 2",
        gridRow: "2 / 3",
        clickAction: "open-modal",
        href: "/x",
        modalHtml: "<p>hi</p>",
        staggerChildren: 2,
        timeline: { steps: [{ t: 1 }] },
        lottieUrl: "u.json",
        lottieAutoplay: true,
        lottieLoop: true,
        lottieSpeed: 1,
        lottieTrigger: "visible",
        animation: "fade",
        animationDuration: 200,
        animationDelay: 100,
        animationEasing: "ease",
        reveal: "once",
        parallax: 0.5,
        sticky: "top",
        stickyOffset: 10,
        children: [child],
      } as any,
    ];

    const { container, getByTestId } = render(
      <DynamicRenderer
        components={components}
        locale="en"
        editor={{ [id]: { hidden: ["tablet"] } } as any}
      />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toMatch(/pb-hide-mobile/);
    expect(wrapper.className).toMatch(/pb-hide-tablet/);
    expect(wrapper.className).toMatch(/pb-animate/);
    expect(wrapper.dataset.pbDuration).toBe("200");
    expect(wrapper.dataset.pbDelay).toBe("100");
    expect(wrapper.dataset.pbEase).toBe("ease");
    expect(wrapper.dataset.pbReveal).toBe("once");
    expect(wrapper.dataset.pbParallax).toBe("0.5");
    expect(wrapper.dataset.pbSticky).toBe("top");
    expect(wrapper.dataset.pbStickyOffset).toBe("10");
    expect(wrapper.dataset.pbHover).toBe("1");
    expect(wrapper.dataset.pbClick).toBe("open-modal");
    expect(wrapper.dataset.pbHref).toBe("/x");
    expect(wrapper.dataset.pbModal).toBe("<p>hi</p>");
    expect(wrapper.dataset.pbStagger).toBe("2");
    expect(wrapper.dataset.pbTimeline).toContain("steps");
    expect(wrapper.dataset.pbLottieUrl).toBe("u.json");
    expect(wrapper.dataset.pbLottieAutoplay).toBe("1");
    expect(wrapper.dataset.pbLottieLoop).toBe("1");
    expect(wrapper.dataset.pbLottieSpeed).toBe("1");
    expect(wrapper.dataset.pbLottieTrigger).toBe("visible");
    expect((wrapper.style as any).zIndex).toBe("5");
    expect(wrapper.style.gridArea).toBe("a");
    expect(wrapper.style.gridColumn).toBe("1 / 2");
    expect(wrapper.style.gridRow).toBe("2 / 3");

    // Hover branch renders a pb-hover-target container
    const inners = screen.getAllByTestId("inner");
    expect(inners[0].parentElement).toHaveClass("pb-hover-target");

    spy.mockRestore();
  });
});
