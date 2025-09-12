/** @jest-environment node */

import { createReverseLogisticsEventDelegate } from "../db/stubs/reverseLogisticsEvent";

describe("reverseLogisticsEvent stub", () => {
  it("create stores events", async () => {
    const delegate = createReverseLogisticsEventDelegate();

    await delegate.create({ data: { id: "e1", type: "received" } });
    await delegate.create({ data: { id: "e2", type: "cleaning" } });

    const events = await delegate.findMany({ where: {} });
    expect(events).toHaveLength(2);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "e1", type: "received" }),
        expect.objectContaining({ id: "e2", type: "cleaning" }),
      ]),
    );
  });

  it("findMany filters by given criteria", async () => {
    const delegate = createReverseLogisticsEventDelegate();

    await delegate.create({ data: { id: "e1", type: "received" } });
    await delegate.create({ data: { id: "e2", type: "cleaning" } });

    const received = await delegate.findMany({ where: { type: "received" } });
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ id: "e1", type: "received" });
  });

  it("findMany returns empty array when no events match", async () => {
    const delegate = createReverseLogisticsEventDelegate();

    await delegate.create({ data: { id: "e1", type: "received" } });
    await delegate.create({ data: { id: "e2", type: "cleaning" } });

    const none = await delegate.findMany({ where: { type: "shipping" } });
    expect(none).toHaveLength(0);
  });
});

