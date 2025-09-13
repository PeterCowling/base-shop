import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Lookbook from "../Lookbook";

describe("Lookbook", () => {
  beforeAll(() => {
    // JSDOM doesn't implement PointerEvent by default
    (global as any).PointerEvent = window.PointerEvent || window.MouseEvent;
  });

  it("moves hotspot and reports snapped coordinates", async () => {
    const handleChange = jest.fn();
    const items = [
      {
        src: "/img.jpg",
        hotspots: [
          { sku: "a", x: 10, y: 10 },
          { sku: "b", x: 50, y: 50 },
        ],
      },
      {
        src: "/img2.jpg",
        hotspots: [{ sku: "c", x: 0, y: 0 }],
      },
    ];

    const { container } = render(
      <Lookbook items={items} onItemsChange={handleChange} />,
    );

    const root = container.firstChild as HTMLDivElement;
    const inner = root.firstChild as HTMLDivElement;
    Object.defineProperty(inner, "getBoundingClientRect", {
      value: () => ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    });

    const hotspot = screen.getByTitle("a");
    fireEvent.pointerDown(hotspot, {
      clientX: 10,
      clientY: 10,
      pointerId: 1,
      pointerType: "mouse",
    });
    fireEvent.pointerMove(document, {
      clientX: 23,
      clientY: 47,
      pointerId: 1,
      pointerType: "mouse",
    });

    await waitFor(() =>
      expect(screen.getByTitle("a")).toHaveStyle({ left: "25%", top: "45%" }),
    );

    fireEvent.pointerUp(document, { pointerId: 1 });

    expect(handleChange).toHaveBeenCalledWith([
      {
        src: "/img.jpg",
        hotspots: [
          { sku: "a", x: 25, y: 45 },
          { sku: "b", x: 50, y: 50 },
        ],
      },
      {
        src: "/img2.jpg",
        hotspots: [{ sku: "c", x: 0, y: 0 }],
      },
    ]);
  });

  it("omits image when src is absent", () => {
    render(<Lookbook items={[{ hotspots: [] }]} />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders hotspots only for items that include them", () => {
    const items = [
      {
        src: "/with-hotspot.jpg",
        hotspots: [{ sku: "with", x: 10, y: 10 }],
      },
      {
        src: "/without-hotspot.jpg",
      },
    ];

    render(<Lookbook items={items} />);

    // Hotspot from first item is rendered
    expect(screen.getByTitle("with")).toBeInTheDocument();
    // Second item has no hotspots
    expect(screen.queryByTitle("missing")).toBeNull();
  });

  it("returns null when no items are provided", () => {
    const { container } = render(<Lookbook items={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
