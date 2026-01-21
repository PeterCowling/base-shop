// Mock builder runtime hooks that use DOM APIs not present in jsdom
import { render, screen } from "@testing-library/react";

import type { PageComponent } from "@acme/types";

import DynamicRenderer from "../DynamicRenderer";

jest.mock("../cms/page-builder/scrollEffects", () => ({
  ensureScrollStyles: jest.fn(),
  ensureAnimationStyles: jest.fn(),
  initScrollEffects: jest.fn(),
}));
jest.mock("../cms/page-builder/timeline", () => ({
  initTimelines: jest.fn(),
}));
jest.mock("../cms/page-builder/lottie", () => ({
  initLottie: jest.fn(),
}));
jest.mock("../cms/lightbox", () => ({
  ensureLightboxStyles: jest.fn(),
  initLightbox: jest.fn(),
}));

const ParentComp = jest.fn(({ children }: any) => (
  <div data-cy="parent">{children}</div>
));

const ChildComp = jest.fn(({ text }: any) => (
  <div data-cy="child">{text}</div>
));

const SimpleComp: jest.Mock = jest.fn(() => <div data-cy="simple" />);

const mockBlockRegistry = {
  Parent: {
    component: ParentComp,
    getRuntimeProps: (_block: PageComponent, locale: string) => ({
      foo: "runtimeProp",
      fromRuntimeProps: `rp-${locale}`,
    }),
  },
  Child: {
    component: ChildComp,
    getRuntimeProps: (block: any, locale: string) => ({
      text: block.text[locale],
    }),
  },
  Simple: {
    component: SimpleComp,
  },
};

jest.mock("../cms/blocks", () => ({ blockRegistry: mockBlockRegistry }));

describe("DynamicRenderer", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("selects components by type string", () => {
    const components: PageComponent[] = [
      { id: "1", type: "Parent" } as any,
      { id: "2", type: "Child", text: { en: "hi" } } as any,
    ];

    render(<DynamicRenderer components={components} locale="en" />);

    expect(ParentComp).toHaveBeenCalled();
    expect(ChildComp).toHaveBeenCalled();
  });

  it("renders null for unknown block type", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const components = [{ id: "1", type: "Unknown" } as PageComponent];

    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );

    expect(warnSpy).toHaveBeenCalledWith(
      "Unknown component type: Unknown"
    );
    expect(container).toBeEmptyDOMElement();
    warnSpy.mockRestore();
  });

  it("passes props through to the rendered component", () => {
    const components: PageComponent[] = [
      {
        id: "1",
        type: "Child",
        text: { en: "hello" },
        custom: "value",
      } as any,
    ];

    render(<DynamicRenderer components={components} locale="en" />);

    expect(ChildComp).toHaveBeenCalled();
    expect(ChildComp.mock.calls[0][0]).toMatchObject({
      id: "1",
      type: "Child",
      locale: "en",
      text: "hello",
      custom: "value",
    });
  });

  it("applies style props to the wrapper div", () => {
    const components: PageComponent[] = [
      {
        id: "1",
        type: "Simple",
        width: "100px",
        height: "200px",
        margin: "4px",
        padding: "2px",
        position: "absolute",
        top: "10px",
        left: "20px",
      } as any,
    ];

    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );

    const wrapper = container.firstChild as HTMLDivElement;
    expect(wrapper).toHaveStyle({
      width: "100px",
      height: "200px",
      margin: "4px",
      padding: "2px",
      position: "absolute",
      top: "10px",
      left: "20px",
    });
  });

  it("renders blocks without getRuntimeProps and no extra props", () => {
    const components: PageComponent[] = [
      { id: "1", type: "Simple" } as any,
    ];

    render(<DynamicRenderer components={components} locale="en" />);

    expect(SimpleComp).toHaveBeenCalled();
    const props = (SimpleComp.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(props).toMatchObject({ id: "1", type: "Simple", locale: "en" });
    expect(Object.keys(props).sort()).toEqual([
      "children",
      "id",
      "locale",
      "type",
    ]);
  });

  it("merges runtime props and runtimeData and renders child blocks", () => {
    const components: PageComponent[] = [
      {
        id: "1",
        type: "Parent",
        children: [{ id: "2", type: "Child", text: { en: "hi" } } as any],
      } as any,
    ];

    render(
      <DynamicRenderer
        components={components}
        locale="en"
        runtimeData={{ Parent: { foo: "runtimeData", fromRuntimeData: "rd" } }}
      />
    );

    expect(ParentComp).toHaveBeenCalled();
    const parentProps = ParentComp.mock.calls[0][0];
    expect(parentProps).toMatchObject({
      id: "1",
      type: "Parent",
      locale: "en",
      foo: "runtimeData",
      fromRuntimeProps: "rp-en",
      fromRuntimeData: "rd",
    });

    expect(ChildComp).toHaveBeenCalled();
    expect(screen.getByTestId("child")).toHaveTextContent("hi");
    expect(screen.getByTestId("parent")).toContainElement(
      screen.getByTestId("child")
    );
  });

  it("adds pb-hide-* classes from editor flags", () => {
    const components: PageComponent[] = [
      { id: "h1", type: "Simple" } as any,
    ];

    const { container } = render(
      <DynamicRenderer components={components} locale="en" editor={{ h1: { hidden: ["desktop", "mobile"] } }} />
    );

    const wrapper = container.firstChild as HTMLDivElement;
    expect(wrapper.className).toContain("pb-hide-desktop");
    expect(wrapper.className).toContain("pb-hide-mobile");
    expect(wrapper.className).not.toContain("pb-hide-tablet");
  });

  it("adds pb-hide-* classes from stamped hiddenBreakpoints when no editor provided", () => {
    const components: PageComponent[] = [
      { id: "h2", type: "Simple", hiddenBreakpoints: ["tablet"] } as any,
    ];

    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );

    const wrapper = container.firstChild as HTMLDivElement;
    expect(wrapper.className).toContain("pb-hide-tablet");
    expect(wrapper.className).not.toContain("pb-hide-desktop");
    expect(wrapper.className).not.toContain("pb-hide-mobile");
  });

  it("adds stackStrategy class to container components", () => {
    const components: PageComponent[] = [
      {
        id: "p",
        type: "Parent",
        // export-time prop for stacking
        stackStrategy: "reverse",
        children: [{ id: "c", type: "Child", text: { en: "a" } } as any],
      } as any,
    ];

    render(<DynamicRenderer components={components} locale="en" />);
    const parentProps = ParentComp.mock.calls[0][0];
    expect(parentProps.className).toContain("pb-stack-mobile-reverse");
  });

  it("adds pb-order-mobile-* class to child wrappers when provided", () => {
    const components: PageComponent[] = [
      {
        id: "p",
        type: "Parent",
        children: [
          { id: "c1", type: "Child", orderMobile: 2, text: { en: "1" } } as any,
          { id: "c2", type: "Child", orderMobile: 1, text: { en: "2" } } as any,
        ],
      } as any,
    ];

    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );

    const wrappers = container.querySelectorAll('.pb-scope');
    // First pb-scope is the Parent wrapper; next two are children
    expect(wrappers[1].className).toContain('pb-order-mobile-2');
    expect(wrappers[2].className).toContain('pb-order-mobile-1');
  });
});
