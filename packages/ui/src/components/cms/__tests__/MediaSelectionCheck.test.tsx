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

  it("applies custom class along with visibility class", () => {
    const { getByTestId } = render(
      <MediaSelectionCheck selected className="custom" />,
    );

    const element = getByTestId("media-selection-check");
    expect(element).toHaveClass("opacity-100");
    expect(element).toHaveClass("custom");
  });
});
