import type { ProductConfigSchema } from "@acme/product-configurator";
import { renderHook, waitFor } from "@testing-library/react";
import * as THREE from "three";

import { useMaterialBindings } from "../src/viewer/materials/useMaterialBindings";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const createScene = () => {
  const scene = new THREE.Scene();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), bodyMaterial);
  bodyMesh.name = "Body_Main";
  const trimMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), trimMaterial);
  trimMesh.name = "Trim_Main";
  scene.add(bodyMesh, trimMesh);
  return { scene, bodyMesh, trimMesh, bodyMaterial, trimMaterial };
};

const schema: ProductConfigSchema = {
  productId: "bag-1",
  version: "1.0.0",
  regions: [],
  properties: [
    {
      key: "finish",
      displayName: "Finish",
      regionId: "body",
      type: "enum",
      values: [
        {
          value: "gold",
          label: "Gold",
          materialBindings: [
            { meshNamePattern: "Body_.*", materialPresetId: "metal_gold" },
          ],
        },
        {
          value: "plain",
          label: "Plain",
        },
      ],
      defaultValue: "plain",
    },
  ],
};

describe("useMaterialBindings", () => {
  it("applies presets to matching meshes and restores base materials", async () => {
    const { scene, bodyMesh, trimMesh, bodyMaterial, trimMaterial } = createScene();

    const { rerender } = renderHook(
      ({ selection }) =>
        useMaterialBindings({ scene, schema, selections: { finish: selection } }),
      { initialProps: { selection: "gold" } },
    );

    await waitFor(() => expect(bodyMesh.material).not.toBe(bodyMaterial));
    const applied = bodyMesh.material as THREE.MeshStandardMaterial;
    expect(applied.metalness).toBeCloseTo(1);
    expect(applied.roughness).toBeCloseTo(0.28);
    expect(applied.color.getHexString()).toBe("d6b16a");
    expect(trimMesh.material).toBe(trimMaterial);

    rerender({ selection: "plain" });

    await waitFor(() => expect(bodyMesh.material).toBe(bodyMaterial));
  });

  it("ignores invalid regex bindings without changing materials", async () => {
    const { scene, bodyMesh, bodyMaterial } = createScene();
    const invalidSchema: ProductConfigSchema = {
      ...schema,
      properties: [
        {
          ...schema.properties[0],
          values: [
            {
              value: "broken",
              label: "Broken",
              materialBindings: [
                { meshNamePattern: "[", materialPresetId: "metal_gold" },
              ],
            },
          ],
          defaultValue: "broken",
        },
      ],
    };

    renderHook(() =>
      useMaterialBindings({ scene, schema: invalidSchema, selections: { finish: "broken" } }),
    );

    await waitFor(() => expect(bodyMesh.material).toBe(bodyMaterial));
  });
});
