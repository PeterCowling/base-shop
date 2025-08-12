import { render, screen, fireEvent } from "@testing-library/react";
import ImageSlider from "../ImageSlider";

describe("ImageSlider", () => {
  it("renders first slide", () => {
    render(
      <ImageSlider
        slides={[
          { src: "/a.jpg", alt: "a" },
          { src: "/b.jpg", alt: "b" },
        ]}
      />
    );
    expect(screen.getByAltText("a")).toBeInTheDocument();
  });

  it("advances to next slide", () => {
    render(
      <ImageSlider
        slides={[
          { src: "/a.jpg", alt: "a" },
          { src: "/b.jpg", alt: "b" },
        ]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /next slide/i }));
    expect(screen.getByAltText("b")).toBeInTheDocument();
  });

  it("returns null when below minItems", () => {
    const { container } = render(
      <ImageSlider slides={[{ src: "/a.jpg" }]} minItems={2} />
    );
    expect(container.firstChild).toBeNull();
  });
});
