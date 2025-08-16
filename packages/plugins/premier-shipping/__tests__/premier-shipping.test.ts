import plugin from "../index";

test("calculateShipping includes surcharge and label", () => {
  const registry = { add: jest.fn() } as any;
  plugin.registerShipping(registry, {
    regions: ["zone1"],
    windows: ["10-11"],
    carriers: ["fast"],
    rate: 5,
    surcharge: 2,
    serviceLabel: "Premier",
  });
  const provider = registry.add.mock.calls[0][1] as any;
  const result = provider.calculateShipping({
    provider: "premier-shipping",
    region: "zone1",
    window: "10-11",
    carrier: "fast",
  });
  expect(result.rate).toBe(7);
  expect(result.surcharge).toBe(2);
  expect(result.serviceLabel).toBe("Premier");
  const slots = provider.getAvailableSlots("zone1");
  expect(slots.carriers).toContain("fast");
});
