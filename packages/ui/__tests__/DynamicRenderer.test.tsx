import { render, screen } from "@testing-library/react";
import DynamicRenderer from "../src/components/DynamicRenderer";
import type { PageComponent } from "@types";

describe("DynamicRenderer", () => {
  it("warns on unknown component type", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const components = [{ id: "1", type: "Unknown" } as PageComponent];

    render(<DynamicRenderer components={components} />);

    expect(warnSpy).toHaveBeenCalledWith("Unknown component type: Unknown");
    warnSpy.mockRestore();
  });

  it("renders known component", () => {
    const components: PageComponent[] = [
      { id: "1", type: "Text", text: { en: "hello" }, locale: "en" } as any,
    ];

    render(<DynamicRenderer components={components} />);

    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
