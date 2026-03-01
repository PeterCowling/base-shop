import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";

import SegmentBuilder from "../src/app/cms/segments/SegmentBuilder";

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  update: jest.fn(),
  promise: async <T,>(value: Promise<T>) => value,
};

jest.mock("@acme/ui/operations", () => ({
  __esModule: true,
  useToast: () => mockToast,
}));

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

    expect(mockToast.success).toHaveBeenCalledWith("Segment saved.");
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

    expect(mockToast.error).toHaveBeenCalledWith("fail");
  });
});
