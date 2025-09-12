import { configure, render } from "@testing-library/react";
import MediaSelectionCheck from "../MediaSelectionCheck";

configure({ testIdAttribute: "data-testid" });

describe("MediaSelectionCheck", () => {
  it("toggles visibility based on selection", () => {
    const { rerender, getByTestId } = render(
      <MediaSelectionCheck selected={false} />,
    );

    expect(getByTestId("media-selection-check")).toHaveClass("opacity-0");

    rerender(<MediaSelectionCheck selected />);

    expect(getByTestId("media-selection-check")).toHaveClass("opacity-100");
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
