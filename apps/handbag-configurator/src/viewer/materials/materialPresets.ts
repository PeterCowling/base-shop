import * as THREE from "three";

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
  tint_black: { color: 0x1b1b1b },
  tint_espresso: { color: 0x3a2a1e },
  tint_chestnut: { color: 0x6b3f2a },
  tint_tan: { color: 0xc29a6b },
  tint_red: { color: 0xb23a2f },
  tint_navy: { color: 0x1f3a5f },
  tint_forest: { color: 0x1f4d3a },
  tint_cream: { color: 0xe8ddc9 },
  tint_slate: { color: 0x6b6f76 },
  tint_burgundy: { color: 0x5b1f2a },
  body_black: { color: 0x151515 },
  body_cream: { color: 0xf6efe4 },
  body_tan: { color: 0xc5945d },
  body_olive: { color: 0x6b6f50 },
  handle_black: { color: 0x151515 },
  handle_espresso: { color: 0x3b2a21 },
  handle_sand: { color: 0xdac8aa },
  metal_gold: {
    color: 0xc4a467,
    metalness: 1,
    roughness: 0.28,
  },
  metal_silver: {
    color: 0xc6cbd4,
    metalness: 1,
    roughness: 0.2,
  },
  lining_microfiber_tan: {
    color: 0xc8a27a,
    metalness: 0,
    roughness: 0.92,
  },
  lining_microfiber_black: {
    color: 0x1c1c1c,
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
