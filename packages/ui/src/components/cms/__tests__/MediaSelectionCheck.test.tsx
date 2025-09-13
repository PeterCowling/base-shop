import { configure, render } from "@testing-library/react";
import MediaSelectionCheck from "../MediaSelectionCheck";

configure({ testIdAttribute: "data-testid" });

describe("MediaSelectionCheck", () => {
  it("toggles visibility based on selection", () => {
    const { rerender, getByTestId } = render(
      <MediaSelectionCheck selected={false} />,
    );

    const getElement = () => getByTestId("media-selection-check");

    expect(getElement()).toHaveClass("opacity-0");
    expect(getElement()).not.toHaveClass("opacity-100");

    rerender(<MediaSelectionCheck selected />);

    expect(getElement()).toHaveClass("opacity-100");
    expect(getElement()).not.toHaveClass("opacity-0");
  });

  it("renders base classes when selected without custom class", () => {
    const { getByTestId } = render(<MediaSelectionCheck selected={true} />);

    const element = getByTestId("media-selection-check");

    expect(element).toHaveClass(
      "pointer-events-none",
      "absolute",
      "top-1",
      "right-1",
      "flex",
      "h-5",
      "w-5",
      "items-center",
      "justify-center",
      "rounded-full",
      "border",
      "border-bg",
      "bg-primary",
      "text-primary-fg",
      "transition-opacity",
      "opacity-100",
    );
    expect(element.className).not.toContain("undefined");
  });
});
