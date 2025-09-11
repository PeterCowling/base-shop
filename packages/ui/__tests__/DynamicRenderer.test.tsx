import { render, screen } from "@testing-library/react";
import DynamicRenderer from "../src/components/DynamicRenderer";
import { blockRegistry } from "../src/components/cms/blocks";
import type { PageComponent } from "@acme/types";

describe("DynamicRenderer", () => {
  it("warns on unknown component type", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const components = [{ id: "1", type: "Unknown" } as PageComponent];

    render(<DynamicRenderer components={components} locale="en" />);

    expect(warnSpy).toHaveBeenCalledWith("Unknown component type: Unknown");
    warnSpy.mockRestore();
  });

  it("renders known component", () => {
    const components: PageComponent[] = [
      { id: "1", type: "Text", text: { en: "hello" } } as any,
    ];

    render(<DynamicRenderer components={components} locale="en" />);

    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders locale-sensitive text", () => {
    const components: PageComponent[] = [
      {
        id: "1",
        type: "Text",
        text: { en: "hello", fr: "bonjour" },
      } as any,
    ];

    render(<DynamicRenderer components={components} locale="fr" />);

    expect(screen.getByText("bonjour")).toBeInTheDocument();
  });

  it("overrides block-provided locale", () => {
    const components: PageComponent[] = [
      {
        id: "1",
        type: "Text",
        text: { en: "hello", fr: "bonjour" },
        locale: "en",
      } as any,
    ];

    render(<DynamicRenderer components={components} locale="fr" />);

    expect(screen.getByText("bonjour")).toBeInTheDocument();
  });

  it("renders a nested Section with child blocks", () => {
    const components: PageComponent[] = [
      {
        id: "1",
        type: "Section",
        children: [
          {
            id: "2",
            type: "Section",
            children: [
              {
                id: "3",
                type: "Text",
                text: { en: "deep" },
              } as any,
            ],
          } as any,
        ],
      } as any,
    ];

    render(<DynamicRenderer components={components} locale="en" />);

    expect(screen.getByText("deep")).toBeInTheDocument();
  });

  it("calls getRuntimeProps for components that define it", () => {
    const renderSpy = jest
      .spyOn(blockRegistry.ProductGrid, "component")
      .mockImplementation(({ runtime }: any) => (
        <div data-testid="grid">{runtime}</div>
      ));
    const runtimeSpy = jest
      .spyOn(blockRegistry.ProductGrid, "getRuntimeProps")
      .mockReturnValue({ runtime: "value" });

    const components: PageComponent[] = [
      { id: "1", type: "ProductGrid" } as any,
    ];

    render(<DynamicRenderer components={components} locale="en" />);

    expect(runtimeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1", type: "ProductGrid" }),
      "en"
    );
    expect(screen.getByText("value")).toBeInTheDocument();
    expect(renderSpy).toHaveBeenCalled();

    renderSpy.mockRestore();
    runtimeSpy.mockRestore();
  });

  it("injects runtimeData into matching block types", () => {
    const spy = jest
      .spyOn(blockRegistry.HeroBanner, "component")
      .mockImplementation(({ foo }: any) => <div>{foo}</div>);

    const components: PageComponent[] = [
      { id: "1", type: "HeroBanner" } as any,
    ];

    render(
      <DynamicRenderer
        components={components}
        locale="en"
        runtimeData={{ HeroBanner: { foo: "bar" } }}
      />
    );

    expect(screen.getByText("bar")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ foo: "bar" }),
      undefined
    );

    spy.mockRestore();
  });

  it("merges getRuntimeProps with runtimeData, preferring runtimeData", () => {
    const renderSpy = jest
      .spyOn(blockRegistry.ProductGrid, "component")
      .mockImplementation(({ foo, bar, baz }: any) => (
        <div>
          {foo}
          {bar}
          {baz}
        </div>
      ));
    const runtimeSpy = jest
      .spyOn(blockRegistry.ProductGrid, "getRuntimeProps")
      .mockReturnValue({ foo: "fromRuntimeProps", bar: "keep" });

    const components: PageComponent[] = [
      { id: "1", type: "ProductGrid" } as any,
    ];

    render(
      <DynamicRenderer
        components={components}
        locale="en"
        runtimeData={{ ProductGrid: { foo: "fromRuntimeData", baz: "extra" } }}
      />
    );

    expect(renderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        foo: "fromRuntimeData",
        bar: "keep",
        baz: "extra",
      }),
      undefined
    );

    runtimeSpy.mockRestore();
    renderSpy.mockRestore();
  });

  it("applies style props to wrapper div", () => {
    const components: PageComponent[] = [
      {
        id: "1",
        type: "Text",
        text: { en: "styled" },
        margin: "1px",
        padding: "2px",
        position: "absolute",
        top: "3px",
        left: "4px",
      } as any,
    ];

    const { container } = render(
      <DynamicRenderer components={components} locale="en" />
    );
    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveStyle({
      margin: "1px",
      padding: "2px",
      position: "absolute",
      top: "3px",
      left: "4px",
    });
  });
});

describe("DynamicRenderer block registry coverage", () => {
  const blockTypes = Object.keys(blockRegistry);
  const stubRegistry = Object.fromEntries(
    blockTypes.map((key) => [
      key,
      {
        component: jest.fn(({ children }: any) => (
          <div data-cy={key}>{children}</div>
        )),
      },
    ])
  ) as Record<string, { component: jest.Mock }>;

  let StubDynamicRenderer: typeof DynamicRenderer;
  beforeAll(() => {
    jest.resetModules();
    jest.doMock("../src/components/cms/blocks", () => ({ blockRegistry: stubRegistry }));
    StubDynamicRenderer = require("../src/components/DynamicRenderer").default;
  });

  afterAll(() => {
    jest.resetModules();
  });

  it.each(blockTypes)("renders %s block", (type) => {
    render(
      <StubDynamicRenderer
        components={[{ id: "1", type } as any]}
        locale="en"
      />
    );
    expect(screen.getByTestId(type)).toBeInTheDocument();
    expect(stubRegistry[type].component).toHaveBeenCalled();
    expect(stubRegistry[type].component.mock.calls[0][0]).toEqual(
      expect.objectContaining({ locale: "en" })
    );
  });
});
