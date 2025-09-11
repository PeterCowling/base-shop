import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import SegmentBuilder from "../src/app/cms/segments/SegmentBuilder";

describe("SegmentBuilder", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("adds filters and resets state after successful save", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
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

    await screen.findByText("Saved");
    expect(screen.getByPlaceholderText(/Segment ID/i)).toHaveValue("");
    expect(screen.getAllByPlaceholderText(/Event type/i)).toHaveLength(1);
    expect(screen.getByPlaceholderText(/Event type/i)).toHaveValue("");
  });

  it("shows Failed status on network error", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
    render(<SegmentBuilder />);

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await screen.findByText("Failed");
  });
});
