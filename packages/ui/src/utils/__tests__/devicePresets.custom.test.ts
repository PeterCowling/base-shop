/* i18n-exempt file -- TEST-0001: unit test titles and literals are not user-facing */
import { getCustomDevicePresets, saveCustomDevicePresets, getAllDevicePresets, findDevicePresetById, CUSTOM_DEVICES_KEY } from "../devicePresets";
import type { DevicePreset } from "../devicePresets";

describe("custom device presets", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns [] when no data or invalid data in localStorage", () => {
    expect(getCustomDevicePresets()).toEqual([]);
    localStorage.setItem(CUSTOM_DEVICES_KEY, "{ not: 'an array' }");
    expect(getCustomDevicePresets()).toEqual([]);
    localStorage.setItem(CUSTOM_DEVICES_KEY, JSON.stringify([{ id: 1 }]));
    expect(getCustomDevicePresets()).toEqual([]);
  });

  it("loads valid presets and coerces orientation", () => {
    const raw = [
      { id: "c1", label: "W", width: 500, height: 300, type: "desktop", orientation: "landscape" },
      { id: "c2", label: "H", width: 320, height: 640, type: "mobile", orientation: "unknown" },
    ];
    localStorage.setItem(CUSTOM_DEVICES_KEY, JSON.stringify(raw));
    const list = getCustomDevicePresets();
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ id: "c1", orientation: "landscape" });
    expect(list[1]).toMatchObject({ id: "c2", orientation: "portrait" });
  });

  it("saveCustomDevicePresets persists normalized list and findDevicePresetById finds items", () => {
    const custom: DevicePreset[] = [
      { id: "cA", label: "A", width: 800, height: 600, type: "desktop", orientation: "portrait" },
    ];
    saveCustomDevicePresets(custom);
    const stored = JSON.parse(localStorage.getItem(CUSTOM_DEVICES_KEY) || "[]");
    expect(Array.isArray(stored)).toBe(true);
    expect(stored[0]).toMatchObject({ id: "cA", orientation: "portrait" });
    const all = getAllDevicePresets();
    expect(all.some((p) => p.id === "cA")).toBe(true);
    expect(findDevicePresetById("cA")?.label).toBe("A");
  });
});
