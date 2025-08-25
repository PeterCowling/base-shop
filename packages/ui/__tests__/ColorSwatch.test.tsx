import { render } from "@testing-library/react";
import { ColorSwatch } from "../src/components/atoms/ColorSwatch";

describe("ColorSwatch", () => {
  it("applies background color", () => {
    const { getByTestId } = render(
      <ColorSwatch color="red" data-testid="swatch" />
    );
    const el = getByTestId("swatch") as HTMLElement;
    expect(el.style.backgroundColor).toBe("red");
  });

  it("adds ring styles when selected", () => {
    const { getByTestId } = render(
      <ColorSwatch color="red" selected data-testid="swatch" />
    );
    const el = getByTestId("swatch") as HTMLElement;
    expect(el.className).toContain("ring-2");
  });
});
