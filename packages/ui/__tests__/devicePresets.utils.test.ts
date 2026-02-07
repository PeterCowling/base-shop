import {
  CUSTOM_DEVICES_KEY,
  type DevicePreset,
  devicePresets,
  findDevicePresetById,
  getAllDevicePresets,
  getCustomDevicePresets,
  getLegacyPreset,
  saveCustomDevicePresets,
} from "../src/utils/devicePresets";

describe("devicePresets utils", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns [] for missing/invalid localStorage", () => {
    expect(getCustomDevicePresets()).toEqual([]);
    window.localStorage.setItem(CUSTOM_DEVICES_KEY, "not json");
    expect(getCustomDevicePresets()).toEqual([]);
    window.localStorage.setItem(CUSTOM_DEVICES_KEY, JSON.stringify({}));
    expect(getCustomDevicePresets()).toEqual([]);
  });

  it("filters invalid items and normalizes orientation", () => {
    const raw = [
      { id: "ok1", label: "OK1", width: 320, height: 480, type: "mobile", orientation: "landscape" },
      { id: "bad1" },
      { id: "ok2", label: "OK2", width: 800, height: 600, type: "tablet", orientation: "weird" },
    ];
    window.localStorage.setItem(CUSTOM_DEVICES_KEY, JSON.stringify(raw));
    const list = getCustomDevicePresets();
    expect(list).toHaveLength(2);
    const a = list.find((p) => p.id === "ok1")!;
    const b = list.find((p) => p.id === "ok2")!;
    expect(a.orientation).toBe("landscape");
    expect(b.orientation).toBe("portrait"); // default fallback
  });

  it("saveCustomDevicePresets persists with portrait orientation and findDevicePresetById works across sources", () => {
    const custom: DevicePreset = {
      id: "cust-1",
      label: "Custom 1",
      width: 111,
      height: 222,
      type: "mobile",
      orientation: "landscape",
    };
    saveCustomDevicePresets([custom]);
    const raw = window.localStorage.getItem(CUSTOM_DEVICES_KEY)!;
    expect(raw).toContain("\"orientation\":\"portrait\""); // normalized on save

    const all = getAllDevicePresets();
    // includes stock + custom
    expect(all.length).toBe(devicePresets.length + 1);

    const baseMatch = findDevicePresetById(devicePresets[0].id);
    const customMatch = findDevicePresetById("cust-1");
    expect(baseMatch).toBeDefined();
    expect(customMatch).toBeDefined();
    expect(customMatch?.id).toBe("cust-1");
  });

  it("getLegacyPreset returns a copy for a given type", () => {
    const a = getLegacyPreset("desktop");
    const b = getLegacyPreset("desktop");
    expect(a).not.toBe(b);
    expect(a.type).toBe("desktop");
  });

  it("findDevicePresetById returns undefined when not found", () => {
    expect(findDevicePresetById("nope" as any)).toBeUndefined();
  });
});
