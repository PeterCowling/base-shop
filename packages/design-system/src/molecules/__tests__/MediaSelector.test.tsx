import "../../../../../../test/resetNextMocks";

import { fireEvent, render, screen } from "@testing-library/react";

import { MediaSelector } from "../MediaSelector";

const mediaItems = [
  { type: "image" as const, src: "/img-1.jpg", alt: "Image one" },
  { type: "image" as const, src: "/img-2.jpg", alt: "Image two" },
  { type: "video" as const, src: "/video-1.mp4", thumbnail: "/video-thumb.jpg" },
];

describe("MediaSelector", () => {
  it("calls onChange with the selected index", () => {
    const onChange = jest.fn();
    render(<MediaSelector items={mediaItems} active={0} onChange={onChange} />);

    const secondThumbnailButton = screen.getByRole("button", { name: "Image two" });
    fireEvent.click(secondThumbnailButton);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("supports shape/radius overrides for thumbnails", () => {
    const { rerender } = render(
      <MediaSelector items={mediaItems} active={0} shape="square" />,
    );
    let firstButton = screen.getAllByRole("button")[0];
    expect(firstButton).toHaveClass("rounded-none");

    rerender(
      <MediaSelector items={mediaItems} active={0} shape="square" radius="xl" />,
    );
    firstButton = screen.getAllByRole("button")[0];
    expect(firstButton).toHaveClass("rounded-xl");
  });
});
