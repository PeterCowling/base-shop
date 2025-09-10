import { devicePresets, getLegacyPreset } from "../src/utils/devicePresets";

describe("devicePresets", () => {
  it("contains expected viewport dimensions and labels", () => {
    const expected = {
      "desktop-1280": { label: "Desktop 1280", width: 1280, height: 800 },
      "desktop-1440": { label: "Desktop 1440", width: 1440, height: 900 },
      "ipad": { label: "iPad", width: 768, height: 1024 },
      "ipad-pro": { label: "iPad Pro", width: 1024, height: 1366 },
      "ipad-mini": { label: "iPad Mini", width: 744, height: 1133 },
      "iphone-se": { label: "iPhone SE", width: 375, height: 667 },
      "iphone-12": { label: "iPhone 12", width: 390, height: 844 },
      "iphone-14": { label: "iPhone 14", width: 390, height: 844 },
      "pixel-7": { label: "Pixel 7", width: 412, height: 915 },
      "galaxy-note": { label: "Galaxy Note", width: 412, height: 869 },
      "galaxy-s8": { label: "Galaxy S8", width: 360, height: 740 },
    } as const;

    expect(devicePresets).toHaveLength(Object.keys(expected).length);

    for (const preset of devicePresets) {
      const match = expected[preset.id as keyof typeof expected];
      expect(match).toBeDefined();
      expect(preset).toMatchObject(match);
    }
  });

  it("handles custom width and height overrides", () => {
    const custom = { ...devicePresets[0], width: 500, height: 400 };

    expect(custom.width).toBe(500);
    expect(custom.height).toBe(400);

    // original preset remains unchanged
    expect(devicePresets[0].width).toBe(1280);
    expect(devicePresets[0].height).toBe(800);
  });

  describe("getLegacyPreset", () => {
    it.each([
      ["desktop", "desktop-1280"],
      ["tablet", "ipad"],
      ["mobile", "iphone-se"],
    ] as const)("returns first %s preset", (type, id) => {
      const expected = devicePresets.find((p) => p.id === id)!;
      const preset = getLegacyPreset(type);

      expect(preset).toEqual(expected);
      expect(preset).not.toBe(expected);
    });

    it("returns copy of devicePresets[0] for invalid type", () => {
      const preset = getLegacyPreset("invalid" as any);

      expect(preset).toEqual(devicePresets[0]);
      expect(preset).not.toBe(devicePresets[0]);

      preset.width = 999;
      expect(devicePresets[0].width).not.toBe(999);
    });
  });
});

