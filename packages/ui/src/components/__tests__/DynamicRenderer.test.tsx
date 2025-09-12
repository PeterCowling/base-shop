import { render, screen } from "@testing-library/react";
import type { PageComponent } from "@acme/types";

const ParentComp = jest.fn(({ children }: any) => (
  <div data-cy="parent">{children}</div>
));

const ChildComp = jest.fn(({ text }: any) => (
  <div data-cy="child">{text}</div>
));

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
};

describe("DynamicRenderer", () => {
  let DynamicRenderer: typeof import("../DynamicRenderer").default;

  beforeAll(() => {
    jest.resetModules();
    jest.doMock("../cms/blocks", () => ({ blockRegistry: mockBlockRegistry }));
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    DynamicRenderer = require("../DynamicRenderer").default;
  });

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
});
