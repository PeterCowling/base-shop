import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import { ColorSwatch } from "../ColorSwatch";

describe("ColorSwatch", () => {
  it("applies background color", () => {
    render(<ColorSwatch color="red" data-cy="swatch" />);
    const button = screen.getByTestId("swatch");
    expect(button).toHaveStyle({ backgroundColor: "red" });
  });

  it("applies ring styles when selected", () => {
    render(<ColorSwatch color="red" selected data-cy="swatch" />);
    const button = screen.getByTestId("swatch");
    expect(button).toHaveClass("ring-2");
    expect(button).toHaveClass("ring-offset-2");
    expect(button).toHaveAttribute("aria-pressed", "true");
  });
});
