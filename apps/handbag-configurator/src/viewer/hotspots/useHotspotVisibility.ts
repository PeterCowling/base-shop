import * as THREE from "three";

import type { ProductConfigSchema } from "@acme/product-configurator";

export type HotspotRegionId =
  | "body"
  | "handle"
  | "hardware"
  | "lining"
  | "personalization";

export type HotspotAnchor = {
  hotspotId: string;
  regionId: HotspotRegionId;
  label: string;
  node: THREE.Object3D;
};

export type VisibleHotspot = {
  hotspotId: string;
  regionId: HotspotRegionId;
  label: string;
  screenX: number;
  screenY: number;
  focusPoint: THREE.Vector3;
  distanceToCamera: number;
};

const REGION_PRIORITY: HotspotRegionId[] = [
  "body",
  "hardware",
  "handle",
  "lining",
  "personalization",
];

const VIEW_CONE_DOT = 0.2;
const OCCLUSION_EPSILON = 0.02;
const SCREEN_MARGIN = 0.12;
const MIN_HOTSPOT_DISTANCE_PX = 52;

function isInRegionMesh(
  object: THREE.Object3D,
  regionMeshes: Set<THREE.Object3D>,
): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (regionMeshes.has(current)) return true;
    current = current.parent;
  }
  return false;
}

export function computeVisibleHotspots({
  anchors,
  schema,
  regionMeshes,
  focusTargets,
  hotspotFocusTargets,
  allMeshes,
  camera,
  size,
  maxVisible,
  minDistancePx,
}: {
  anchors: HotspotAnchor[];
  schema?: ProductConfigSchema;
  regionMeshes: Record<HotspotRegionId, Set<THREE.Object3D>>;
  focusTargets: Partial<Record<HotspotRegionId, THREE.Object3D>>;
  hotspotFocusTargets?: Partial<Record<string, THREE.Object3D>>;
  allMeshes: THREE.Object3D[];
  camera: THREE.Camera;
  size: { width: number; height: number };
  maxVisible?: number;
  minDistancePx?: number;
}): VisibleHotspot[] {
  const raycaster = new THREE.Raycaster();
  const viewDir = new THREE.Vector3();
  const anchorPos = new THREE.Vector3();
  const projected = new THREE.Vector3();

  camera.getWorldDirection(viewDir);

  const candidates: Array<
    VisibleHotspot & { priority: number; centerBias: number; distanceBias: number }
  > = [];
  const configurableRegions = schema
    ? new Set(schema.properties.map((property) => property.regionId))
    : null;

  for (const anchor of anchors) {
    if (configurableRegions && !configurableRegions.has(anchor.regionId)) {
      continue;
    }
    anchor.node.getWorldPosition(anchorPos);
    const toAnchor = anchorPos.clone().sub(camera.position);
    const distanceToCamera = toAnchor.length();
    const viewDot = viewDir.dot(toAnchor.clone().normalize());
    if (viewDot < VIEW_CONE_DOT) continue;

    projected.copy(anchorPos).project(camera);
    if (projected.z < 0 || projected.z > 1) continue;
    const maxScreen = 1 - SCREEN_MARGIN;
    if (Math.abs(projected.x) > maxScreen || Math.abs(projected.y) > maxScreen) {
      continue;
    }

    const regionSet = regionMeshes[anchor.regionId];
    raycaster.set(camera.position, toAnchor.normalize());
    const hits = raycaster.intersectObjects(allMeshes, true);
    const firstHit = hits[0];
    if (firstHit && firstHit.distance < distanceToCamera - OCCLUSION_EPSILON) {
      if (!regionSet || !isInRegionMesh(firstHit.object, regionSet)) {
        continue;
      }
    }

    const screenX = (projected.x * 0.5 + 0.5) * size.width;
    const screenY = (-projected.y * 0.5 + 0.5) * size.height;

    const regionLabel =
      schema?.regions.find((region) => region.regionId === anchor.regionId)
        ?.displayName ?? anchor.label;

    const focusNode =
      hotspotFocusTargets?.[anchor.hotspotId] ?? focusTargets[anchor.regionId];
    const focusPoint = focusNode
      ? focusNode.getWorldPosition(new THREE.Vector3())
      : anchorPos.clone();

    const centerBias = Math.abs(projected.x) + Math.abs(projected.y);
    const priority = REGION_PRIORITY.indexOf(anchor.regionId);

    candidates.push({
      hotspotId: anchor.hotspotId,
      regionId: anchor.regionId,
      label: regionLabel,
      screenX,
      screenY,
      focusPoint,
      distanceToCamera,
      priority,
      centerBias,
      distanceBias: distanceToCamera,
    });
  }

  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.centerBias !== b.centerBias) return a.centerBias - b.centerBias;
    return a.distanceBias - b.distanceBias;
  });

  const spaced: VisibleHotspot[] = [];
  const minDistance = minDistancePx ?? MIN_HOTSPOT_DISTANCE_PX;
  const limit = typeof maxVisible === "number" ? maxVisible : 8;
  for (const candidate of candidates) {
    if (minDistance > 0) {
      const overlaps = spaced.some((existing) => {
        const dx = existing.screenX - candidate.screenX;
        const dy = existing.screenY - candidate.screenY;
        return Math.hypot(dx, dy) < minDistance;
      });
      if (overlaps) continue;
    }
    spaced.push(candidate);
    if (spaced.length >= limit) break;
  }

  return spaced;
}
