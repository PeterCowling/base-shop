import { fireViewItem, resetImpressionDedupe, shouldFireImpressionOnce } from "@/utils/ga4-events";

describe("GA4 fireViewItem (TASK-08)", () => {
  let originalGtag: typeof window.gtag;
  let gtagMock: jest.Mock;

  beforeEach(() => {
    originalGtag = window.gtag;
    gtagMock = jest.fn();
    window.gtag = gtagMock;
    resetImpressionDedupe();
  });

  afterEach(() => {
    window.gtag = originalGtag;
  });

  it("TC-01: fires view_item with items[0].item_id matching provided itemId", () => {
    fireViewItem({ itemId: "room_10", itemName: "Room 10" });

    expect(gtagMock).toHaveBeenCalledWith("event", "view_item", {
      items: [
        {
          item_id: "room_10",
          item_name: "Room 10",
        },
      ],
    });
  });

  it("TC-02: fires view_item with items[0].item_id === apartment", () => {
    fireViewItem({ itemId: "apartment", itemName: "apartment" });

    expect(gtagMock).toHaveBeenCalledWith("event", "view_item", {
      items: [
        {
          item_id: "apartment",
          item_name: "apartment",
        },
      ],
    });
  });

  it("uses per-navigation dedupe (fires once per itemId per navigation)", () => {
    fireViewItem({ itemId: "room_10" });
    fireViewItem({ itemId: "room_10" }); // Should not fire again

    expect(gtagMock).toHaveBeenCalledTimes(1);
  });

  it("defaults itemName to itemId if not provided", () => {
    fireViewItem({ itemId: "room_10" });

    expect(gtagMock).toHaveBeenCalledWith("event", "view_item", {
      items: [
        {
          item_id: "room_10",
          item_name: "room_10",
        },
      ],
    });
  });

  it("does not fire when gtag is unavailable", () => {
    window.gtag = undefined as unknown as typeof window.gtag;

    fireViewItem({ itemId: "room_10" });

    expect(gtagMock).not.toHaveBeenCalled();
  });
});
