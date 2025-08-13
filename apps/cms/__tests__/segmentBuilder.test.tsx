import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import SegmentBuilder from "../src/app/cms/segments/SegmentBuilder";

describe("SegmentBuilder", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
  });

  it("adds filters and submits segment", async () => {
    render(<SegmentBuilder />);

    expect(screen.getAllByPlaceholderText(/Event type/i)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /add filter/i }));
    expect(screen.getAllByPlaceholderText(/Event type/i)).toHaveLength(2);

    fireEvent.change(screen.getByPlaceholderText(/Shop/i), {
      target: { value: "shop" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Segment ID/i), {
      target: { value: "vip" },
    });
    fireEvent.change(screen.getAllByPlaceholderText(/Event type/i)[0], {
      target: { value: "purchase" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/segments",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: "shop",
          id: "vip",
          filters: [{ field: "type", value: "purchase" }],
        }),
      })
    );
  });
});
