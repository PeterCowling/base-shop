import "../../../../../test/resetNextMocks";
import { configure, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { MediaSelector, type MediaItem } from "./MediaSelector";

configure({ testIdAttribute: "data-testid" });

function Wrapper({ onChange }: { onChange: (i: number) => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [active, setActive] = useState(0);

  return (
    <div>
      <input
        data-testid="file-input"
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setItems([{ type: "image", src: file.name }]);
            setActive(0);
          }
        }}
      />
      <MediaSelector
        items={items}
        active={active}
        onChange={(i) => {
          setActive(i);
          onChange(i);
        }}
      />
    </div>
  );
}

describe("MediaSelector", () => {
  it("updates preview and state when selecting a file", () => {
    const handle = jest.fn();
    render(<Wrapper onChange={handle} />);

    const input = screen.getByTestId("file-input") as HTMLInputElement;
    const file = new File(["test"], "preview.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    const img = screen.getByAltText("thumbnail") as HTMLImageElement;
    expect(img.src).toContain("preview.jpg");

    const button = screen.getByRole("button");
    expect(button.className).toContain("ring-2");

    fireEvent.click(button);
    expect(handle).toHaveBeenCalledWith(0);
  });
});
