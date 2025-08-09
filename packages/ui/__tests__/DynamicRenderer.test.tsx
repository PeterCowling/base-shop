import { render, screen } from "@testing-library/react";
import DynamicRenderer from "../src/components/DynamicRenderer";
import { blockRegistry } from "../src/components/cms/blocks";
import type { PageComponent } from "@types";

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

  it("passes runtime props to components like ProductGrid", () => {
    const spy = jest
      .spyOn(blockRegistry, "ProductGrid")
      .mockImplementation(({ runtime }: any) => (
        <div data-testid="grid">{runtime}</div>
      ));

    const components: PageComponent[] = [
      { id: "1", type: "ProductGrid", runtime: "value" } as any,
    ];

    render(<DynamicRenderer components={components} locale="en" />);

    expect(screen.getByText("value")).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0]).toEqual(
      expect.objectContaining({ runtime: "value" })
    );

    spy.mockRestore();
  });

  it("injects runtimeData into matching block types", () => {
    const spy = jest
      .spyOn(blockRegistry, "HeroBanner")
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
      expect.objectContaining({ foo: "bar" })
    );

    spy.mockRestore();
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
    blockTypes.map((key) => [key, ({ children }: any) => <div data-testid={key}>{children}</div>])
  );

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
  });
});
