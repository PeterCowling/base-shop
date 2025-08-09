import { render, screen } from "@testing-library/react";
import DynamicRenderer from "../src/components/DynamicRenderer";
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

  it("renders nested components recursively", () => {
    const components: PageComponent[] = [
      {
        id: "1",
        type: "Section",
        children: [
          {
            id: "2",
            type: "Text",
            text: { en: "nested" },
          } as any,
        ],
      } as any,
    ];

    render(<DynamicRenderer components={components} locale="en" />);

    expect(screen.getByText("nested")).toBeInTheDocument();
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

  it("renders locale-specific text", () => {
    const components: PageComponent[] = [
      { id: "1", type: "Text", text: { en: "hello", de: "hallo" } } as any,
    ];

    render(<DynamicRenderer components={components} locale="de" />);

    expect(screen.getByText("hallo")).toBeInTheDocument();
  });
});
