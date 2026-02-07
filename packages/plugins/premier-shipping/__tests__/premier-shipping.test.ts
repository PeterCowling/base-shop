import plugin from "../index";

const createProvider = () => {
  const registry = { add: jest.fn() } as any;
  plugin.registerShipping!(registry, {
    regions: ["zone1"],
    windows: ["10-11"],
    carriers: ["fast"],
    rate: 5,
    surcharge: 2,
    serviceLabel: "Premier",
  });
  return registry.add.mock.calls[0][1] as any;
};

test("calculateShipping includes surcharge and label", () => {
  const provider = createProvider();
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

test("calculateShipping validates region, window, and carrier", () => {
  const provider = createProvider();
  expect(() =>
    provider.calculateShipping({
      provider: "premier-shipping",
      region: "zone2",
      window: "10-11",
    }),
  ).toThrow("Region not supported");
  expect(() =>
    provider.calculateShipping({
      provider: "premier-shipping",
      region: "zone1",
      window: "11-12",
    }),
  ).toThrow("Invalid delivery window");
  expect(() =>
    provider.calculateShipping({
      provider: "premier-shipping",
      region: "zone1",
      window: "10-11",
      carrier: "slow",
    }),
  ).toThrow("Carrier not supported");
});

test("getAvailableSlots validates region", () => {
  const provider = createProvider();
  expect(() => provider.getAvailableSlots("zone2")).toThrow("Region not supported");
});

test("schedulePickup validates inputs", () => {
  const provider = createProvider();
  expect(() =>
    provider.schedulePickup("zone2", "2024-01-01", "10-11"),
  ).toThrow("Region not supported");
  expect(() =>
    provider.schedulePickup("zone1", "2024-01-01", "11-12"),
  ).toThrow("Invalid delivery window");
  expect(() =>
    provider.schedulePickup("zone1", "2024-01-01", "10-11", "slow"),
  ).toThrow("Carrier not supported");
});

test("schedulePickup updates internal state", () => {
  const provider = createProvider();
  provider.schedulePickup("zone1", "2024-01-02", "10-11", "fast");
  expect((provider as any).state).toEqual({
    region: "zone1",
    date: "2024-01-02",
    window: "10-11",
  });
});

test("schedulePickup surfaces network failures", () => {
  const provider = createProvider();
  const err = new Error("Network down");
  jest.spyOn(provider, "schedulePickup").mockImplementation(() => {
    throw err;
  });

  expect(() =>
    provider.schedulePickup("zone1", "2024-01-03", "10-11", "fast"),
  ).toThrow("Network down");
});

test("schedulePickup surfaces invalid credential errors", () => {
  const provider = createProvider();
  const err = new Error("Invalid credentials");
  jest.spyOn(provider, "schedulePickup").mockImplementation(() => {
    throw err;
  });

  expect(() =>
    provider.schedulePickup("zone1", "2024-01-03", "10-11", "fast"),
  ).toThrow("Invalid credentials");
});
