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

    expect(screen.getAllByLabelText(/Field/i)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /add filter/i }));
    expect(screen.getAllByLabelText(/Field/i)).toHaveLength(2);

    const shopInput = await screen.findByLabelText(/Shop/i);
    fireEvent.change(shopInput, { target: { value: "shop" } });
    fireEvent.change(screen.getByLabelText(/Segment ID/i), {
      target: { value: "vip" },
    });
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "VIP" },
    });
    fireEvent.change(screen.getAllByLabelText(/Value/i)[0], {
      target: { value: "purchase" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save segment/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/segments",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: "shop",
          id: "vip",
          name: "VIP",
          filters: [{ field: "type", value: "purchase" }],
        }),
      })
    );

    await screen.findByText("Segment saved.");
    expect(screen.getByLabelText(/Segment ID/i)).toHaveValue("");
    expect(screen.getByLabelText(/Name/i)).toHaveValue("");
    expect(screen.getAllByLabelText(/Field/i)).toHaveLength(1);
    expect(screen.getAllByLabelText(/Value/i)[0]).toHaveValue("");
  });

  it("shows Failed status on network error", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
    render(<SegmentBuilder />);

    const shopInput = await screen.findByLabelText(/Shop/i);
    fireEvent.change(shopInput, { target: { value: "shop" } });
    fireEvent.change(screen.getByLabelText(/Segment ID/i), {
      target: { value: "vip" },
    });
    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "VIP" },
    });
    fireEvent.change(screen.getAllByLabelText(/Value/i)[0], {
      target: { value: "purchase" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save segment/i }));

    await screen.findByText("fail");
  });
});
