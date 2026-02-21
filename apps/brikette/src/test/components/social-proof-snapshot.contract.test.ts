import hotel from "@/config/hotel";
import { buildHotelNode } from "@/utils/schema/builders";

describe("social proof snapshot contract", () => {
  it("defines a ratings snapshot date fixed to November 2025", () => {
    expect((hotel as unknown as Record<string, unknown>).ratingsSnapshotDate).toBe("2025-11-01");
  });

  it("emits snapshot date semantics in hotel JSON-LD", () => {
    const hotelNode = buildHotelNode();
    const additional = Array.isArray(hotelNode.additionalProperty)
      ? (hotelNode.additionalProperty as Array<Record<string, unknown>>)
      : [];

    expect(additional).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "PropertyValue",
          propertyID: "ratingsSnapshotDate",
          value: "2025-11-01",
        }),
      ]),
    );
  });
});
