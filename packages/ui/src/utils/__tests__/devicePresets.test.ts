// packages/ui/src/utils/__tests__/devicePresets.test.ts
import {
  CUSTOM_DEVICES_KEY,
  devicePresets,
  findDevicePresetById,
  getAllDevicePresets,
  getCustomDevicePresets,
  getLegacyPreset,
  saveCustomDevicePresets,
} from "../devicePresets";

describe("devicePresets", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("has at least desktop/tablet/mobile presets", () => {
    const types = new Set(devicePresets.map((p) => p.type));
    expect(types.has("desktop")).toBe(true);
    expect(types.has("tablet")).toBe(true);
    expect(types.has("mobile")).toBe(true);
  });

  test("getLegacyPreset returns a shallow copy for type", () => {
    const d = getLegacyPreset("desktop");
    expect(d.type).toBe("desktop");
    // shallow copy guarantee (mutating result does not affect source)
    const original = devicePresets.find((p) => p.type === "desktop")!;
    d.label = "changed";
    expect(original.label).not.toBe("changed");
  });

  test("custom device presets persisted to localStorage and merged", () => {
    const custom = [
      {
        id: "my-phone",
        label: "My Phone",
        width: 360,
        height: 800,
        type: "mobile" as const,
        orientation: "landscape" as const,
      },
    ];
    saveCustomDevicePresets(custom);
    const raw = window.localStorage.getItem(CUSTOM_DEVICES_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    // save coerces orientation to portrait for storage, retrieval normalizes
    expect(parsed[0].orientation).toBe("portrait");

    const loaded = getCustomDevicePresets();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toMatchObject({ id: "my-phone", width: 360, height: 800, type: "mobile" });
    // landscape persisted as portrait in storage but normalized back to portrait/landscape guard
    expect(["portrait", "landscape"]).toContain(loaded[0].orientation);

    const all = getAllDevicePresets();
    expect(all.some((p) => p.id === "my-phone")).toBe(true);
  });

  test("findDevicePresetById searches across built-in and custom", () => {
    saveCustomDevicePresets([
      { id: "custom-1", label: "C1", width: 100, height: 200, type: "desktop", orientation: "portrait" },
    ]);
    expect(findDevicePresetById("custom-1")?.label).toBe("C1");
    const builtin = devicePresets[0];
    expect(findDevicePresetById(builtin.id)?.label).toBe(builtin.label);
  });

  test("getCustomDevicePresets rejects invalid structures", () => {
    // invalid JSON
    window.localStorage.setItem(CUSTOM_DEVICES_KEY, "not-json");
    expect(getCustomDevicePresets()).toEqual([]);
    // wrong types
    window.localStorage.setItem(CUSTOM_DEVICES_KEY, JSON.stringify([{ id: 1, label: 2 }]));
    expect(getCustomDevicePresets()).toEqual([]);
  });
});

