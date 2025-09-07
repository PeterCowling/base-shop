import { render } from "@testing-library/react";
import VideoBlock from "../VideoBlock";

describe("VideoBlock", () => {
  it("renders video with src", () => {
    const { container } = render(<VideoBlock src="movie.mp4" />);
    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "movie.mp4");
  });

  it("supports autoplay", () => {
    const { container } = render(<VideoBlock src="movie.mp4" autoplay />);
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
  });

  it("plays when play is called", () => {
    const playSpy = jest
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue();
    const { container } = render(<VideoBlock src="movie.mp4" />);
    const video = container.querySelector("video") as HTMLVideoElement;
    video.play();
    expect(playSpy).toHaveBeenCalled();
    playSpy.mockRestore();
  });

  it("returns null without src", () => {
    const { container } = render(<VideoBlock />);
    expect(container.firstChild).toBeNull();
  });
});
