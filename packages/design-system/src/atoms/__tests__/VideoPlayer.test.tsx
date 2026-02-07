import "../../../../../../test/resetNextMocks";

import { render } from "@testing-library/react";
import { axe } from "jest-axe";

import { VideoPlayer } from "../VideoPlayer";

describe("VideoPlayer", () => {
  it("renders video element with default and custom classes", async () => {
    const { container, getByText } = render(<VideoPlayer className="rounded-md" />);
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();

    expect(video).toHaveAttribute("controls");
    expect(video).toHaveClass("w-full");
    // Note: cn() (tailwind-merge) replaces conflicting utilities,
    // so rounded-md overrides the default rounded-lg
    expect(video).toHaveClass("rounded-md");
    expect(getByText("Captions are not available for this video.")).toBeInTheDocument();
  });
});
