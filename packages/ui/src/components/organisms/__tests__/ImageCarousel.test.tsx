import { render } from "@testing-library/react";

import { ImageCarousel } from "../ImageCarousel";

describe("ImageCarousel", () => {
  it("renders images", () => {
    const images = [
      { src: "/a.jpg", alt: "A" },
      { src: "/b.jpg", alt: "B" },
    ];
    const { getByAltText } = render(<ImageCarousel images={images} />);
    expect(getByAltText("A")).toBeInTheDocument();
    expect(getByAltText("B")).toBeInTheDocument();
  });

  it("renders null when images array is empty", () => {
    const { container } = render(<ImageCarousel images={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
