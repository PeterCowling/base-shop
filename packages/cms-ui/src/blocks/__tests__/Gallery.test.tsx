import "../../../../../../../test/resetNextMocks";
import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import Gallery from "../Gallery";

describe("Gallery", () => {
  const images = [
    { src: "/a.jpg", alt: "a", caption: "Caption A" },
    { src: "/b.jpg", alt: "b" },
  ];

  it("renders images with optional captions", () => {
    const { container } = render(<Gallery images={images} />);
    expect(screen.getByAltText("a")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByText("Caption A")).toBeInTheDocument();
    expect(container.querySelectorAll("figcaption")).toHaveLength(1);
    expect(container.firstChild).toHaveClass("grid");
    expect(container.firstChild).toHaveClass("sm:grid-cols-2");
    expect(container.firstChild).toHaveClass("md:grid-cols-3");
  });

  it("returns null with empty images array", () => {
    const { container } = render(<Gallery images={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
