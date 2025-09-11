import { render, screen, fireEvent } from "@testing-library/react";
import { ProductGallery } from "../src/components/organisms/ProductGallery";
import type { MediaItem } from "../src/components/molecules/MediaSelector";

describe("ProductGallery", () => {
  it("returns null when media is empty", () => {
    const { container } = render(<ProductGallery media={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders image media", () => {
    const media: MediaItem[] = [{ type: "image", src: "/a.jpg", alt: "A" }];
    const { container } = render(<ProductGallery media={media} />);
    const main = container.querySelector(".relative.aspect-square")!;
    expect(main.querySelector("img")).toBeInTheDocument();
  });

  it("renders video media", () => {
    const media: MediaItem[] = [{ type: "video", src: "/a.mp4" }];
    const { container } = render(<ProductGallery media={media} />);
    const main = container.querySelector(".relative.aspect-square")!;
    expect(main.querySelector("video")).toBeInTheDocument();
  });

  it("renders 360 media", () => {
    const media: MediaItem[] = [{ type: "360", src: "/360.jpg", frames: ["/1.jpg", "/2.jpg"] }];
    const { container } = render(<ProductGallery media={media} />);
    expect(container.querySelector(".touch-none img")).toBeInTheDocument();
  });

  it("renders model media", () => {
    const media: MediaItem[] = [{ type: "model", src: "/model.glb" }];
    const { container } = render(<ProductGallery media={media} />);
    expect(container.querySelector("model-viewer")).toBeInTheDocument();
  });

  it("updates viewer when selecting different media", () => {
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
