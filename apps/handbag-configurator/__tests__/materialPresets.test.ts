import * as THREE from "three";

import { applyMaterialPreset } from "../src/viewer/materials/materialPresets";

describe("applyMaterialPreset", () => {
  it("applies preset values to standard materials", () => {
    const material = new THREE.MeshStandardMaterial({ color: "#ffffff" });

    applyMaterialPreset(material, "metal_gold");

    expect(material.color.getHexString()).toBe("d6b16a");
    expect(material.metalness).toBeCloseTo(1);
    expect(material.roughness).toBeCloseTo(0.28);
    expect(material.needsUpdate).toBe(true);
  });

  it("ignores unknown presets and non-standard materials", () => {
    const standard = new THREE.MeshStandardMaterial({ color: "#ff0000" });
    applyMaterialPreset(standard, "unknown");
    expect(standard.color.getHexString()).toBe("ff0000");

    const basic = new THREE.MeshBasicMaterial({ color: "#00ff00" });
    applyMaterialPreset(basic, "body_black");
    expect(basic.color.getHexString()).toBe("00ff00");
  });
});
