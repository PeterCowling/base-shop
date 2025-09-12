import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { ImageCarousel } from "./ImageCarousel";

function CarouselWithArrows({ images }: { images: { src: string; alt?: string }[] }) {
  const [index, setIndex] = React.useState(0);
  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  return (
    <div>
      <button aria-label="previous" onClick={prev}>
        Prev
      </button>
      <ImageCarousel images={[images[index]]} />
      <button aria-label="next" onClick={next}>
        Next
      </button>
    </div>
  );
}

describe("ImageCarousel navigation", () => {
  it("shows the correct image when navigating with arrows", async () => {
    const images = [
      { src: "/a.jpg", alt: "A" },
      { src: "/b.jpg", alt: "B" },
    ];
    const user = userEvent.setup();
    render(<CarouselWithArrows images={images} />);
    expect(screen.getByAltText("A")).toBeInTheDocument();
    await user.click(screen.getByLabelText("next"));
    expect(screen.getByAltText("B")).toBeInTheDocument();
    expect(screen.queryByAltText("A")).toBeNull();
    await user.click(screen.getByLabelText("previous"));
    expect(screen.getByAltText("A")).toBeInTheDocument();
  });
});
