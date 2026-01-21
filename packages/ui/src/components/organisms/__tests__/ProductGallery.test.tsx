/* i18n-exempt file -- test strings for alt text and types */
import "../../../../../../test/resetNextMocks";

import { render } from "@testing-library/react";

import type { MediaItem } from "../../molecules/MediaSelector";
import { ProductGallery } from "../ProductGallery";

describe("ProductGallery media types", () => {
  it("renders image media", () => {
    const media: MediaItem[] = [
      { type: "image", src: "/a.jpg", alt: "A" },
    ];
    const { container } = render(<ProductGallery media={media} />);
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("renders video media", () => {
    const media: MediaItem[] = [{ type: "video", src: "/a.mp4" }];
    const { container } = render(<ProductGallery media={media} />);
    expect(container.querySelector("video")).toBeInTheDocument();
  });

  it("renders 360 media", () => {
    const media: MediaItem[] = [
      { type: "360", src: "/360.jpg", frames: ["/1.jpg", "/2.jpg"] },
    ];
    const { container } = render(<ProductGallery media={media} />);
    expect(container.querySelector(".touch-none img")).toBeInTheDocument();
  });

  it("renders model media", () => {
    const media: MediaItem[] = [{ type: "model", src: "/model.glb" }];
    const { container } = render(<ProductGallery media={media} />);
    expect(container.querySelector("model-viewer")).toBeInTheDocument();
  });
});

describe("ProductGallery selector", () => {
  it("hides selector when only one item", () => {
    const media: MediaItem[] = [{ type: "image", src: "/a.jpg" }];
    const { container } = render(<ProductGallery media={media} />);
    expect(container.querySelector(".flex.gap-2")).toBeNull();
  });

  it("shows selector when multiple items", () => {
    const media: MediaItem[] = [
      { type: "image", src: "/a.jpg" },
      { type: "video", src: "/b.mp4" },
    ];
    const { container } = render(<ProductGallery media={media} />);
    expect(container.querySelector(".flex.gap-2")).toBeInTheDocument();
  });
});

it("returns null when media array is empty", () => {
  const { container } = render(<ProductGallery media={[]} />);
  expect(container.firstChild).toBeNull();
});
