import { createReverseLogisticsEventDelegate } from "../src/db/stubs/reverseLogisticsEvent";

describe("reverseLogisticsEvent delegate", () => {
  it("createMany inserts multiple events and returns count", async () => {
    const delegate = createReverseLogisticsEventDelegate();
    const result = await delegate.createMany({
      data: [
        { id: "e1", type: "received" },
        { id: "e2", type: "cleaning" },
      ],
    });
    expect(result).toEqual({ count: 2 });
    const events = await delegate.findMany({ where: {} });
    expect(events).toHaveLength(2);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "e1", type: "received" }),
        expect.objectContaining({ id: "e2", type: "cleaning" }),
      ]),
    );
  });

  it("findMany respects arbitrary where filters", async () => {
    const delegate = createReverseLogisticsEventDelegate();
    await delegate.createMany({
      data: [
        { id: "e1", type: "received", shop: "s1" },
        { id: "e2", type: "received", shop: "s2" },
        { id: "e3", type: "cleaning", shop: "s1" },
      ],
    });
    const filtered = await delegate.findMany({
      where: { type: "received", shop: "s1" },
    });
    expect(filtered).toEqual([
      { id: "e1", type: "received", shop: "s1" },
    ]);
  });
});
