import type { ProductConfigSchema } from "@acme/product-configurator";
import * as THREE from "three";

import {
  computeVisibleHotspots,
  type HotspotAnchor,
  type HotspotRegionId,
} from "../src/viewer/hotspots/useHotspotVisibility";

const size = { width: 800, height: 600 };

const createCamera = () => {
  const camera = new THREE.PerspectiveCamera(50, size.width / size.height, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return camera;
};

const createAnchor = (
  hotspotId: string,
  regionId: HotspotRegionId,
  position: THREE.Vector3,
  label = hotspotId,
): HotspotAnchor => {
  const node = new THREE.Object3D();
  node.position.copy(position);
  node.updateMatrixWorld();
  return { hotspotId, regionId, label, node };
};

const createRegionMeshes = () => ({
  body: new Set<THREE.Object3D>(),
  handle: new Set<THREE.Object3D>(),
  hardware: new Set<THREE.Object3D>(),
  lining: new Set<THREE.Object3D>(),
  personalization: new Set<THREE.Object3D>(),
});

describe("computeVisibleHotspots", () => {
  it("filters by configurable regions and uses schema labels", () => {
    const camera = createCamera();
    const anchors = [
      createAnchor("hs_body", "body", new THREE.Vector3(0, 0, 0), "Body"),
      createAnchor("hs_lining", "lining", new THREE.Vector3(0.2, 0, 0), "Lining"),
    ];
    const schema: ProductConfigSchema = {
      productId: "test",
      version: "1.0.0",
      regions: [{ regionId: "body", displayName: "Body Panel" }],
      properties: [
        {
          key: "body",
          displayName: "Body",
          regionId: "body",
          type: "enum",
          values: [{ value: "black", label: "Black" }],
          defaultValue: "black",
        },
      ],
    };

    const visible = computeVisibleHotspots({
      anchors,
      schema,
      regionMeshes: createRegionMeshes(),
      focusTargets: {},
      allMeshes: [],
      camera,
      size,
    });

    expect(visible).toHaveLength(1);
    expect(visible[0]?.hotspotId).toBe("hs_body");
    expect(visible[0]?.label).toBe("Body Panel");
  });

  it("rejects occluded anchors unless the hit mesh belongs to the region", () => {
    const camera = createCamera();
    const anchor = createAnchor("hs_body", "body", new THREE.Vector3(0, 0, 0), "Body");
    const occluder = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    occluder.position.set(0, 0, 2.5);
    occluder.updateMatrixWorld();

    const allMeshes = [occluder];
    const regionMeshes = createRegionMeshes();

    const occluded = computeVisibleHotspots({
      anchors: [anchor],
      regionMeshes,
      focusTargets: {},
      allMeshes,
      camera,
      size,
    });
    expect(occluded).toHaveLength(0);

    regionMeshes.body.add(occluder);
    const visible = computeVisibleHotspots({
      anchors: [anchor],
      regionMeshes,
      focusTargets: {},
      allMeshes,
      camera,
      size,
    });
    expect(visible).toHaveLength(1);
  });

  it("prefers the most centered hotspot when spacing filters overlaps", () => {
    const camera = createCamera();
    const anchors = [
      createAnchor("center", "body", new THREE.Vector3(0, 0, 0), "Center"),
      createAnchor("edge", "body", new THREE.Vector3(0.4, 0.1, 0), "Edge"),
    ];

    const visible = computeVisibleHotspots({
      anchors,
      regionMeshes: createRegionMeshes(),
      focusTargets: {},
      allMeshes: [],
      camera,
      size,
      minDistancePx: 1000,
    });

    expect(visible).toHaveLength(1);
    expect(visible[0]?.hotspotId).toBe("center");
  });

  it("uses hotspot focus targets over region focus targets", () => {
    const camera = createCamera();
    const anchors = [
      createAnchor("hs_body", "body", new THREE.Vector3(0, 0, 0), "Body"),
    ];
    const regionFocus = new THREE.Object3D();
    regionFocus.position.set(1, 0, 0);
    regionFocus.updateMatrixWorld();
    const hotspotFocus = new THREE.Object3D();
    hotspotFocus.position.set(2, 0, 0);
    hotspotFocus.updateMatrixWorld();

    const visible = computeVisibleHotspots({
      anchors,
      regionMeshes: createRegionMeshes(),
      focusTargets: { body: regionFocus },
      hotspotFocusTargets: { hs_body: hotspotFocus },
      allMeshes: [],
      camera,
      size,
    });

    expect(visible).toHaveLength(1);
    expect(visible[0]?.focusPoint.x).toBeCloseTo(2);
    expect(visible[0]?.focusPoint.y).toBeCloseTo(0);
    expect(visible[0]?.focusPoint.z).toBeCloseTo(0);
  });

  it("prefers higher priority regions when candidates overlap", () => {
    const camera = createCamera();
    const anchors = [
      createAnchor("hs_body", "body", new THREE.Vector3(0, 0, 0), "Body"),
      createAnchor("hs_handle", "handle", new THREE.Vector3(0, 0, 0), "Handle"),
    ];

    const visible = computeVisibleHotspots({
      anchors,
      regionMeshes: createRegionMeshes(),
      focusTargets: {},
      allMeshes: [],
      camera,
      size,
      minDistancePx: 1000,
      maxVisible: 1,
    });

    expect(visible).toHaveLength(1);
    expect(visible[0]?.hotspotId).toBe("hs_body");
  });
});
