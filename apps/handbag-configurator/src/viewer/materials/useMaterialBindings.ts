import type { ProductConfigSchema, SelectionState } from "@acme/product-configurator";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { applyMaterialPreset } from "./materialPresets";

type CompiledBinding = {
  regex: RegExp;
  materialPresetId?: string;
  materialName?: string;
  fallbackSlotName?: string;
};

type MaterialBundle = THREE.Material | THREE.Material[];

function cloneMaterialBundle(material: MaterialBundle) {
  if (Array.isArray(material)) {
    return material.map((entry) => entry.clone());
  }
  return material.clone();
}

function applyPresetToBundle(material: MaterialBundle, presetId: string) {
  if (Array.isArray(material)) {
    for (const entry of material) {
      applyMaterialPreset(entry, presetId);
    }
    return;
  }
  applyMaterialPreset(material, presetId);
}

function getBaseMaterial(mesh: THREE.Mesh) {
  const data = mesh.userData as { __baseMaterial?: MaterialBundle };
  if (!data.__baseMaterial) {
    data.__baseMaterial = mesh.material;
  }
  return data.__baseMaterial;
}

function compileBindings(
  schema?: ProductConfigSchema,
  selections?: SelectionState,
): CompiledBinding[] {
  if (!schema || !selections) return [];
  const slotMap = schema.assets?.base?.slots ?? {};
  const compiled: CompiledBinding[] = [];
  for (const property of schema.properties) {
    const selected = selections[property.key] ?? property.defaultValue;
    const entry = property.values.find((value) => value.value === selected);
    for (const binding of entry?.materialBindings ?? []) {
      try {
        const fallbackSlotName =
          slotMap[property.regionId as keyof typeof slotMap];
        compiled.push({
          // eslint-disable-next-line security/detect-non-literal-regexp -- ABC-123 regex is sourced from curated product config
          regex: new RegExp(binding.meshNamePattern),
          ...(binding.materialPresetId
            ? { materialPresetId: binding.materialPresetId }
            : {}),
          ...(binding.materialName ? { materialName: binding.materialName } : {}),
          ...(fallbackSlotName ? { fallbackSlotName } : {}),
        });
      } catch {
        // Ignore invalid regex patterns in schema bindings.
      }
    }
  }
  return compiled;
}

export function useMaterialBindings({
  scene,
  schema,
  selections,
  materialLibrary,
  enabled = true,
  refreshKey,
}: {
  scene?: THREE.Object3D | null;
  schema?: ProductConfigSchema;
  selections?: SelectionState;
  materialLibrary?: Record<string, MaterialBundle>;
  enabled?: boolean;
  refreshKey?: string | number;
}) {
  const bindings = useMemo(
    () => compileBindings(schema, selections),
    [schema, selections],
  );

  useEffect(() => {
    if (!scene || !enabled) return;
    const matchCounts = new Map<CompiledBinding, number>();
    for (const binding of bindings) {
      matchCounts.set(binding, 0);
    }
    scene.traverse((node: THREE.Object3D) => {
      if (!(node as THREE.Mesh).isMesh) return;
      const mesh = node as THREE.Mesh;
      const baseMaterial = getBaseMaterial(mesh);
      const matching = bindings.filter((binding) => binding.regex.test(mesh.name));
      if (matching.length === 0) {
        mesh.material = baseMaterial;
        return;
      }
      let templateMaterial: MaterialBundle = baseMaterial;
      for (const binding of matching) {
        if (!binding.materialName) continue;
        const swap = materialLibrary?.[binding.materialName];
        if (swap) {
          templateMaterial = swap;
        }
      }

      const nextMaterial = cloneMaterialBundle(templateMaterial);
      for (const binding of matching) {
        if (binding.materialPresetId) {
          applyPresetToBundle(nextMaterial, binding.materialPresetId);
        }
        matchCounts.set(binding, (matchCounts.get(binding) ?? 0) + 1);
      }
      mesh.material = nextMaterial;
    });

    const fallbackBySlot = new Map<string, CompiledBinding[]>();
    for (const binding of bindings) {
      if ((matchCounts.get(binding) ?? 0) > 0) continue;
      if (!binding.fallbackSlotName) continue;
      const list = fallbackBySlot.get(binding.fallbackSlotName) ?? [];
      list.push(binding);
      fallbackBySlot.set(binding.fallbackSlotName, list);
    }

    for (const [slotName, slotBindings] of fallbackBySlot) {
      const slot = scene.getObjectByName(slotName);
      if (!slot) continue;
      slot.traverse((node: THREE.Object3D) => {
        if (!(node as THREE.Mesh).isMesh) return;
        const mesh = node as THREE.Mesh;
        const baseMaterial = getBaseMaterial(mesh);
        let templateMaterial: MaterialBundle = baseMaterial;
        for (const binding of slotBindings) {
          if (!binding.materialName) continue;
          const swap = materialLibrary?.[binding.materialName];
          if (swap) {
            templateMaterial = swap;
          }
        }
        const nextMaterial = cloneMaterialBundle(templateMaterial);
        for (const binding of slotBindings) {
          if (binding.materialPresetId) {
            applyPresetToBundle(nextMaterial, binding.materialPresetId);
          }
        }
        mesh.material = nextMaterial;
      });
    }
  }, [scene, bindings, materialLibrary, enabled, refreshKey]);
}
