/** @jest-environment node */
import { createReverseLogisticsEventDelegate } from "../reverseLogisticsEvent";

describe("reverseLogisticsEvent delegate", () => {
  it("creates and filters events", async () => {
    const d = createReverseLogisticsEventDelegate();
    await d.create({ data: { id: 1, type: "scan", trackingNumber: "t1" } as any });
    await d.createMany({
      data: [
        { id: 2, type: "scan", trackingNumber: "t2" },
        { id: 3, type: "delivered", trackingNumber: "t1" },
      ] as any[],
    });
    const t1Events = await d.findMany({ where: { trackingNumber: "t1" } as any });
    expect(t1Events).toHaveLength(2);
  });
});

