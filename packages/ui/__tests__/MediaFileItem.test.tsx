import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  type MediaItem,
  MediaSelector,
} from "../src/components/molecules/MediaSelector";

describe("MediaFileItem", () => {
  const items: MediaItem[] = [
    { type: "image", src: "/a.jpg", thumbnail: "/thumb.jpg" },
    { type: "video", src: "/b.mp4" },
  ];

  function Wrapper({ onSelect }: { onSelect: (i: number) => void }) {
    const [active, setActive] = useState(0);
    return (
      <MediaSelector
        items={items}
        active={active}
        onChange={(i) => {
          setActive(i);
          onSelect(i);
        }}
      />
    );
  }

  it("renders metadata and selection state, and calls onSelect on click", () => {
    const handle = jest.fn();
    render(<Wrapper onSelect={handle} />);

    // image item renders provided thumbnail
    const img = screen.getAllByRole("img")[0] as HTMLImageElement;
    expect(img.src).toContain("thumb.jpg");

    // video item shows a label
    expect(screen.getByText("Video")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    expect(buttons[0].className).toContain("ring-2");
    expect(buttons[1].className).not.toContain("ring-2");

    fireEvent.click(buttons[1]);
    expect(handle).toHaveBeenCalledWith(1);
    expect(buttons[1].className).toContain("ring-2");
  });
});
