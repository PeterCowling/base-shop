import { devicePresets, getLegacyPreset } from "../devicePresets";

describe("devicePresets data", () => {
  it("contains valid preset data", () => {
    expect(devicePresets.length).toBeGreaterThan(0);

    const ids = new Set<string>();
    for (const preset of devicePresets) {
      expect(typeof preset.id).toBe("string");
      expect(preset.id).not.toHaveLength(0);
      expect(typeof preset.label).toBe("string");
      expect(preset.label).not.toHaveLength(0);
      expect(typeof preset.width).toBe("number");
      expect(preset.width).toBeGreaterThan(0);
      expect(typeof preset.height).toBe("number");
      expect(preset.height).toBeGreaterThan(0);
      expect(["desktop", "tablet", "mobile"]).toContain(preset.type);
      expect(ids.has(preset.id)).toBe(false);
      ids.add(preset.id);
    }
  });

  it("returns a preset for legacy viewport type", () => {
    ( ["desktop", "tablet", "mobile"] as const ).forEach((type) => {
      const preset = getLegacyPreset(type);
      expect(preset.type).toBe(type);
    });
  });

  it("returns the correct preset for a valid type", () => {
    const expected = devicePresets.find((p) => p.type === "tablet");
    const preset = getLegacyPreset("tablet");
    expect(preset).toEqual(expected);
  });

  it("falls back to the default preset for an unknown type", () => {
    const preset = getLegacyPreset("unknown" as any);
    expect(preset).toEqual(devicePresets[0]);
  });

  it("all presets use portrait orientation", () => {
    expect(devicePresets.every((p) => p.orientation === "portrait")).toBe(true);
  });

  it("getLegacyPreset returns a cloned object", () => {
    const preset = getLegacyPreset("desktop");
    preset.width = 1;
    expect(devicePresets[0].width).not.toBe(1);
  });
});
