import { render, screen, fireEvent } from "@testing-library/react";
import { ProductGallery } from "./ProductGallery";
import type { MediaItem } from "../molecules/MediaSelector";
import "../../../../../test/resetNextMocks";

describe("ProductGallery interactions", () => {
  it("updates main viewer when a thumbnail is clicked", () => {
    const media: MediaItem[] = [
      { type: "image", src: "/a.jpg", alt: "A" },
      { type: "video", src: "/b.mp4" },
    ];
    const { container } = render(<ProductGallery media={media} />);
    const main = container.querySelector(".relative.aspect-square")!;

    expect(main.querySelector("img")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button")[1]);

    expect(main.querySelector("video")).toBeInTheDocument();
  });
});
