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
});
