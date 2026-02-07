/* eslint-disable ds/no-raw-color -- HAND-0008 [ttl=2026-12-31]: Three.js material preset colors for 3D rendering */
import type * as THREE from "three";

type MaterialPreset = {
  color?: THREE.ColorRepresentation;
  metalness?: number;
  roughness?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
};

const MATERIAL_PRESETS: Record<string, MaterialPreset> = {
  leather_calf_black: {
    roughness: 0.82,
    metalness: 0.02,
  },
  leather_calf_cream: {
    roughness: 0.74,
    metalness: 0.02,
  },
  tint_black: { color: "#1b1b1b" },
  tint_espresso: { color: "#3a2a1e" },
  tint_chestnut: { color: "#6b3f2a" },
  tint_tan: { color: "#c29a6b" },
  tint_red: { color: "#b23a2f" },
  tint_navy: { color: "#1f3a5f" },
  tint_forest: { color: "#1f4d3a" },
  tint_cream: { color: "#e8ddc9" },
  tint_slate: { color: "#6b6f76" },
  tint_burgundy: { color: "#5b1f2a" },
  body_black: { color: "#151515" },
  body_cream: { color: "#f6efe4" },
  body_tan: { color: "#c5945d" },
  body_olive: { color: "#6b6f50" },
  handle_black: { color: "#151515" },
  handle_espresso: { color: "#3b2a21" },
  handle_sand: { color: "#dac8aa" },
  metal_gold: {
    color: "#c4a467",
    metalness: 1,
    roughness: 0.28,
  },
  metal_silver: {
    color: "#c6cbd4",
    metalness: 1,
    roughness: 0.2,
  },
  lining_microfiber_tan: {
    color: "#c8a27a",
    metalness: 0,
    roughness: 0.92,
  },
  lining_microfiber_black: {
    color: "#1c1c1c",
    metalness: 0,
    roughness: 0.92,
  },
};

export function applyMaterialPreset(material: THREE.Material, presetId: string) {
  const preset = MATERIAL_PRESETS[presetId];
  if (!preset) return;
  const standard = material as THREE.MeshStandardMaterial;
  if (!standard.isMeshStandardMaterial) return;

  if (preset.color !== undefined) {
    standard.color.set(preset.color);
  }
  if (preset.metalness !== undefined) {
    standard.metalness = preset.metalness;
  }
  if (preset.roughness !== undefined) {
    standard.roughness = preset.roughness;
  }
  if (preset.emissive !== undefined) {
    standard.emissive.set(preset.emissive);
  }
  if (preset.emissiveIntensity !== undefined) {
    standard.emissiveIntensity = preset.emissiveIntensity;
  }
  standard.needsUpdate = true;
}
