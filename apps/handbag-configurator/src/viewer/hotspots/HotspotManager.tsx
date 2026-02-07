"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type * as THREE from "three";

import type { ProductConfigSchema, ProductHotspotConfig } from "@acme/product-configurator";

import { useModeStore } from "../state/modeStore";

import {
  computeVisibleHotspots,
  type HotspotAnchor,
  type HotspotRegionId,
  type VisibleHotspot,
} from "./useHotspotVisibility";

type HotspotManagerProps = {
  scene?: THREE.Object3D | null;
  schema?: ProductConfigSchema;
  hotspotConfig?: ProductHotspotConfig | null;
  onHotspotsChange?: (hotspots: VisibleHotspot[]) => void;
};

const HOTSPOT_PREFIX = "hs_";
const FOCUS_PREFIX = "focus_";
const REGION_IDS: HotspotRegionId[] = [
  "body",
  "handle",
  "hardware",
  "lining",
  "personalization",
];
const REGION_ID_SET = new Set(REGION_IDS);
const REGION_PREFIX: Record<HotspotRegionId, string[]> = {
  body: ["Body_"],
  handle: ["Handle_"],
  hardware: ["Hardware_"],
  lining: ["Lining_"],
  personalization: ["Personalization_", "Monogram_"],
};

function asRegionId(value?: string): HotspotRegionId | null {
  if (!value) return null;
  return REGION_ID_SET.has(value as HotspotRegionId)
    ? (value as HotspotRegionId)
    : null;
}

function extractAnchors(
  scene?: THREE.Object3D | null,
  schema?: ProductConfigSchema,
  hotspotConfig?: ProductHotspotConfig | null,
): HotspotAnchor[] {
  if (!scene) return [];
  const anchors: HotspotAnchor[] = [];
  const seen = new Set<string>();
  const regionLabels = new Map(
    schema?.regions.map((region) => [region.regionId, region.displayName]) ?? [],
  );

  const addAnchor = (
    hotspotId: string,
    regionId: HotspotRegionId | null,
    node?: THREE.Object3D,
    label?: string,
  ) => {
    if (!regionId || !node) return;
    const key = hotspotId;
    if (seen.has(key)) return;
    seen.add(key);
    anchors.push({
      hotspotId,
      regionId,
      label: label ?? regionLabels.get(regionId) ?? regionId,
      node,
    });
  };

  if (hotspotConfig?.hotspots?.length) {
    for (const hotspot of hotspotConfig.hotspots) {
      const regionId = asRegionId(hotspot.regionId);
      const nodeName = hotspot.nodeName ?? hotspot.id;
      const node = scene.getObjectByName(nodeName);
      addAnchor(hotspot.id, regionId, node ?? undefined, hotspot.label);
    }
    return anchors;
  }

  for (const region of schema?.regions ?? []) {
    if (!region.hotspotId) continue;
    const node = scene.getObjectByName(region.hotspotId);
    addAnchor(region.hotspotId, region.regionId, node ?? undefined, region.displayName);
  }

  scene.traverse((node: THREE.Object3D) => {
    if (node.name.startsWith(HOTSPOT_PREFIX)) {
      const regionId = asRegionId(node.name.replace(HOTSPOT_PREFIX, ""));
      addAnchor(node.name, regionId, node);
      return;
    }
    const hotspotData = (node.userData as { hotspot?: { regionId?: string } })
      ?.hotspot;
    if (hotspotData?.regionId) {
      const regionId = asRegionId(hotspotData.regionId);
      addAnchor(node.name || `${regionId ?? "unknown"}-${node.uuid}`, regionId, node);
    }
  });
  return anchors;
}

function extractRegionMeshes(scene?: THREE.Object3D | null) {
  const regionMeshes: Record<HotspotRegionId, Set<THREE.Object3D>> = {
    body: new Set(),
    handle: new Set(),
    hardware: new Set(),
    lining: new Set(),
    personalization: new Set(),
  };

  if (!scene) return regionMeshes;

  scene.traverse((node: THREE.Object3D) => {
    if (!(node as THREE.Mesh).isMesh) return;
    const regionId = (Object.entries(REGION_PREFIX) as Array<
      [HotspotRegionId, string[]]
    >).find(([, prefixes]) => prefixes.some((prefix) => node.name.startsWith(prefix)))
      ?.[0];
    if (!regionId) return;
    regionMeshes[regionId].add(node);
  });

  return regionMeshes;
}

function extractAllMeshes(scene?: THREE.Object3D | null) {
  const meshes: THREE.Object3D[] = [];
  if (!scene) return meshes;
  scene.traverse((node: THREE.Object3D) => {
    if (!(node as THREE.Mesh).isMesh) return;
    meshes.push(node);
  });
  return meshes;
}

function extractFocusTargets(
  scene?: THREE.Object3D | null,
  schema?: ProductConfigSchema,
) {
  if (!scene) return {};
  const focusTargets: Partial<Record<HotspotRegionId, THREE.Object3D>> = {};
  const seen = new Set<HotspotRegionId>();

  for (const region of schema?.regions ?? []) {
    if (!region.focusTargetNode) continue;
    const node = scene.getObjectByName(region.focusTargetNode);
    if (!node) continue;
    focusTargets[region.regionId] = node;
    seen.add(region.regionId);
  }

  scene.traverse((node: THREE.Object3D) => {
    if (!node.name.startsWith(FOCUS_PREFIX)) return;
    const regionId = asRegionId(node.name.replace(FOCUS_PREFIX, ""));
    if (!regionId || seen.has(regionId)) return;
    focusTargets[regionId] = node;
  });
  return focusTargets;
}

function extractHotspotFocusTargets(
  scene?: THREE.Object3D | null,
  hotspotConfig?: ProductHotspotConfig | null,
) {
  const focusTargets: Partial<Record<string, THREE.Object3D>> = {};
  if (!scene || !hotspotConfig?.hotspots?.length) return focusTargets;
  for (const hotspot of hotspotConfig.hotspots) {
    if (!hotspot.focusTargetNode) continue;
    const node = scene.getObjectByName(hotspot.focusTargetNode);
    if (!node) continue;
    focusTargets[hotspot.id] = node;
  }
  return focusTargets;
}

export function HotspotManager({
  scene,
  schema,
  hotspotConfig,
  onHotspotsChange,
}: HotspotManagerProps) {
  const { camera, size } = useThree();
  const lastHotspots = useRef<VisibleHotspot[]>([]);
  const configMode = useModeStore((state) => state.hotspotConfigMode);

  const anchors = useMemo(
    () => extractAnchors(scene, schema, hotspotConfig),
    [scene, schema, hotspotConfig],
  );
  const regionMeshes = useMemo(() => extractRegionMeshes(scene), [scene]);
  const allMeshes = useMemo(() => extractAllMeshes(scene), [scene]);
  const focusTargets = useMemo(
    () => extractFocusTargets(scene, schema),
    [scene, schema],
  );
  const hotspotFocusTargets = useMemo(
    () => extractHotspotFocusTargets(scene, hotspotConfig),
    [scene, hotspotConfig],
  );

  useFrame(() => {
    if (!scene || anchors.length === 0) {
      if (lastHotspots.current.length) {
        lastHotspots.current = [];
        onHotspotsChange?.([]);
      }
      return;
    }

    const next = computeVisibleHotspots({
      anchors,
      regionMeshes,
      focusTargets,
      hotspotFocusTargets,
      allMeshes,
      camera,
      size,
      ...(configMode ? { maxVisible: anchors.length, minDistancePx: 0 } : {}),
      ...(schema ? { schema } : {}),
    });

    const serialized = next.map(
      (item) =>
        `${item.hotspotId}:${item.screenX.toFixed(1)}:${item.screenY.toFixed(1)}`,
    );
    const previous = lastHotspots.current.map(
      (item) =>
        `${item.hotspotId}:${item.screenX.toFixed(1)}:${item.screenY.toFixed(1)}`,
    );
    if (serialized.join("|") === previous.join("|")) return;
    lastHotspots.current = next;
    onHotspotsChange?.(next);
  });

  useEffect(() => {
    if (!scene) onHotspotsChange?.([]);
  }, [scene, onHotspotsChange]);

  return null;
}
