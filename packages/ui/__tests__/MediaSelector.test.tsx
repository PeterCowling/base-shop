import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import {
  MediaItem,
  MediaSelector,
} from "../components/molecules/MediaSelector";

describe("MediaSelector", () => {
  const items: MediaItem[] = [
    { type: "image", url: "/a.jpg" },
    { type: "video", url: "/b.mp4" },
  ];

  function Wrapper({ onChange }: { onChange: (i: number) => void }) {
    const [active, setActive] = useState(0);
    return (
      <MediaSelector
        items={items}
        active={active}
        onChange={(i) => {
          setActive(i);
          onChange(i);
        }}
      />
    );
  }

  it("calls onChange and highlights active item", () => {
    const handle = jest.fn();
    render(<Wrapper onChange={handle} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[0].className).toContain("ring-2");
    fireEvent.click(buttons[1]);
    expect(handle).toHaveBeenCalledWith(1);
    expect(buttons[1].className).toContain("ring-2");
  });
});
