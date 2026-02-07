import { render } from "@testing-library/react";

import MediaSelectionCheck from "../src/components/cms/MediaSelectionCheck";

describe("MediaSelectionCheck", () => {
  it("shows and hides the check icon based on selection", () => {
    const { rerender, container } = render(
      <MediaSelectionCheck selected={false} />,
    );

    const getWrapper = () =>
      container.querySelector(
        '[data-testid="media-selection-check"]',
      ) as HTMLElement;
    const getIcon = () => getWrapper().querySelector("svg")!;

    expect(getWrapper()).toHaveClass("opacity-0");
    expect(getIcon()).toHaveAttribute("aria-hidden", "true");

    rerender(<MediaSelectionCheck selected />);

    expect(getWrapper()).toHaveClass("opacity-100");
    expect(getIcon()).toHaveAttribute("aria-hidden", "true");
  });
});
