import { sanitizeHotspots } from "../src/app/api/products/[productId]/hotspots/hotspotUtils";

describe("sanitizeHotspots", () => {
  it("returns null for non-array payloads", () => {
    expect(sanitizeHotspots("nope")).toBeNull();
  });

  it("filters invalid entries and normalizes optional fields", () => {
    const input = [
      {
        id: "hs_1",
        regionId: "body",
        label: "Body",
        nodeName: "Node_1",
        focusTargetNode: "Focus_1",
        offset: { x: 0.4, y: -0.2 },
        propertyKeys: ["color", 123, "finish"],
      },
      { id: "bad id", regionId: "body" },
      { id: "hs_2", regionId: "bad/region" },
      { id: "hs_3", regionId: "lining", offset: { x: "x", y: Infinity } },
    ];

    expect(sanitizeHotspots(input)).toEqual([
      {
        id: "hs_1",
        regionId: "body",
        label: "Body",
        nodeName: "Node_1",
        focusTargetNode: "Focus_1",
        offset: { x: 0.4, y: -0.2 },
        propertyKeys: ["color", "finish"],
      },
      {
        id: "hs_3",
        regionId: "lining",
        offset: { x: 0, y: 0 },
      },
    ]);
  });
});
