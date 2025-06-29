import { render } from "@testing-library/react";
import { VideoPlayer } from "../components/atoms/VideoPlayer";

describe("VideoPlayer", () => {
  it("renders video element with provided class names", () => {
    const { container } = render(<VideoPlayer className="extra" />);
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video?.className).toContain("w-full");
    expect(video?.className).toContain("rounded-lg");
    expect(video?.className).toContain("extra");
  });
});
