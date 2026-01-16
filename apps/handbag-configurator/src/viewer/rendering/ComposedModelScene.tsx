"use client";

import { useLoader, useThree } from "@react-three/fiber";
import type { ProductConfigSchema, SelectionState } from "@acme/product-configurator";
import { Component, type ReactNode, Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { FrameBounds } from "../controls/CameraController";
import type { ResolvedPartAsset } from "../assets/useTieredProductAsset";
import { useMaterialBindings } from "../materials/useMaterialBindings";

type PartScene = ResolvedPartAsset & {
  scene: THREE.Object3D;
};

type MaterialBundle = THREE.Material | THREE.Material[];

class PartErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  override state: { hasError: boolean } = { hasError: false };

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

type ComposedModelSceneProps = {
  baseUrl: string;
  parts: ResolvedPartAsset[];
  hideBaseMeshPatterns?: string[];
  schema?: ProductConfigSchema;
  selections?: SelectionState;
  debugMode?: boolean;
  onSceneReady: (scene: THREE.Object3D) => void;
  onBoundsReady: (bounds: FrameBounds | null) => void;
  onAnimationsReady?: (clips: THREE.AnimationClip[]) => void;
};

const TARGET_DIAMETER = 2.7;

function configureGltfLoader(
  loader: GLTFLoader,
  gl: THREE.WebGLRenderer,
) {
  try {
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath("/ktx2/");
    ktx2Loader.detectSupport(gl);
    loader.setKTX2Loader(ktx2Loader);
  } catch {
    // KTX2 loader is optional; fall back to standard textures.
  }
  try {
    loader.setMeshoptDecoder(MeshoptDecoder);
  } catch {
    // Meshopt is optional; keep defaults if unavailable.
  }
}

function cloneScene(scene: THREE.Object3D) {
  try {
    return cloneSkeleton(scene) as THREE.Object3D;
  } catch {
    return scene.clone(true);
  }
}

function collectMaterials(scene: THREE.Object3D) {
  const library: Record<string, MaterialBundle> = {};
  scene.traverse((node: THREE.Object3D) => {
    if (!(node as THREE.Mesh).isMesh) return;
    const mesh = node as THREE.Mesh;
    const bundle = mesh.material as MaterialBundle;
    const record = (material: THREE.Material) => {
      if (!material.name) return;
      if (!library[material.name]) {
        library[material.name] = material;
      }
    };
    if (Array.isArray(bundle)) {
      for (const entry of bundle) record(entry);
    } else {
      record(bundle);
    }
  });
  return library;
}

function unwrapSceneRoot(scene: THREE.Object3D) {
  if (!(scene as THREE.Scene).isScene) return scene;
  const root = new THREE.Group();
  root.name = scene.name || "SceneRoot";
  root.position.copy(scene.position);
  root.rotation.copy(scene.rotation);
  root.scale.copy(scene.scale);
  root.userData = { ...scene.userData };
  while (scene.children.length > 0) {
    root.add(scene.children[0]!);
  }
  return root;
}

function normalizeScene(scene: THREE.Object3D) {
  scene.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(scene);
  if (box.isEmpty()) return;

  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxAxis = Math.max(size.x, size.y, size.z);
  if (maxAxis <= 0) return;

  const scale = TARGET_DIAMETER / maxAxis;
  scene.scale.setScalar(scale);
  scene.position.sub(center.multiplyScalar(scale));
  scene.updateMatrixWorld(true);
}

function computeBounds(scene: THREE.Object3D): FrameBounds | null {
  const box = new THREE.Box3().setFromObject(scene);
  if (box.isEmpty()) return null;
  const sphere = new THREE.Sphere();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getBoundingSphere(sphere);
  box.getSize(size);
  box.getCenter(center);
  return { sphere, size, center };
}

function countMeshes(root: THREE.Object3D) {
  let count = 0;
  root.traverse((node: THREE.Object3D) => {
    if ((node as THREE.Mesh).isMesh) count += 1;
  });
  return count;
}

function compileHidePatterns(patterns?: string[]) {
  if (!patterns || patterns.length === 0) return [];
  return patterns
    .map((pattern) => {
      try {
        // eslint-disable-next-line security/detect-non-literal-regexp -- ABC-123 pattern is defined in product asset config
        return new RegExp(pattern);
      } catch {
        return null;
      }
    })
    .filter((regex): regex is RegExp => Boolean(regex));
}

function applyBaseMeshVisibility(
  scene: THREE.Object3D,
  hidePatterns?: string[],
) {
  const compiled = compileHidePatterns(hidePatterns);
  scene.traverse((node: THREE.Object3D) => {
    if (!(node as THREE.Mesh).isMesh) return;
    const mesh = node as THREE.Mesh;
    const data = mesh.userData as { __baseVisibility?: boolean };
    if (data.__baseVisibility === undefined) {
      data.__baseVisibility = mesh.visible;
    }
    mesh.visible = data.__baseVisibility ?? true;
    if (compiled.length === 0) return;
    if (compiled.some((pattern) => pattern.test(mesh.name))) {
      mesh.visible = false;
    }
  });
}

function clearPartAttachments(scene: THREE.Object3D) {
  scene.traverse((node: THREE.Object3D) => {
    for (const child of [...node.children]) {
      const data = child.userData as { __partAttachment?: boolean };
      if (data.__partAttachment) {
        node.remove(child);
      }
    }
  });
}

function PartLoader({
  parts,
  onReady,
}: {
  parts: ResolvedPartAsset[];
  onReady: (scenes: PartScene[]) => void;
}) {
  const { gl } = useThree();
  const urls = parts.map((part) => part.url);
  const gltfs = useLoader(GLTFLoader, urls, (loader) =>
    configureGltfLoader(loader, gl),
  );

  const scenes = useMemo(
    () =>
      parts.map((part, index) => ({
        ...part,
        scene: unwrapSceneRoot(cloneScene(gltfs[index]!.scene)),
      })),
    [gltfs, parts],
  );

  useEffect(() => {
    onReady(scenes);
  }, [scenes, onReady]);

  return null;
}

export function ComposedModelScene({
  baseUrl,
  parts,
  hideBaseMeshPatterns,
  schema,
  selections,
  debugMode = false,
  onSceneReady,
  onBoundsReady,
  onAnimationsReady,
}: ComposedModelSceneProps) {
  const { gl } = useThree();
  const baseGltf = useLoader(GLTFLoader, baseUrl, (loader) =>
    configureGltfLoader(loader, gl),
  );
  const baseScene = useMemo(
    () => unwrapSceneRoot(cloneScene(baseGltf.scene)),
    [baseGltf],
  );
  const requestedMaterialNames = useMemo(() => {
    const names = new Set<string>();
    for (const property of schema?.properties ?? []) {
      for (const value of property.values) {
        for (const binding of value.materialBindings ?? []) {
          if (binding.materialName) names.add(binding.materialName);
        }
      }
    }
    return Array.from(names).sort();
  }, [schema]);
  const requestedMaterialsKey = useMemo(
    () => requestedMaterialNames.join("|"),
    [requestedMaterialNames],
  );
  const [materialLibrary, setMaterialLibrary] = useState<
    Record<string, MaterialBundle>
  >({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const library = collectMaterials(baseScene);
      if (requestedMaterialNames.length === 0) {
        if (!cancelled) setMaterialLibrary(library);
        return;
      }
      const parser = (baseGltf as unknown as { parser?: unknown }).parser as
        | undefined
        | {
            json?: { materials?: Array<{ name?: string }> };
            getDependency?: (type: string, index: number) => Promise<unknown>;
          };
      const jsonMaterials = parser?.json?.materials ?? [];
      for (const name of requestedMaterialNames) {
        if (library[name]) continue;
        const index = jsonMaterials.findIndex((entry) => entry?.name === name);
        if (index < 0) continue;
        try {
          const dependency = await parser?.getDependency?.("material", index);
          if (dependency && (dependency as THREE.Material).isMaterial) {
            library[name] = dependency as THREE.Material;
          }
        } catch {
          // Ignore missing/invalid materials; fallback to base materials.
        }
      }
      if (!cancelled) setMaterialLibrary(library);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [baseGltf, baseScene, requestedMaterialsKey, requestedMaterialNames]);
  const [partScenes, setPartScenes] = useState<PartScene[]>([]);
  const partsKey = useMemo(
    () =>
      parts
        .map(
          (part) =>
            `${part.id}:${part.variantId}:${part.url}:${part.slotName ?? ""}`,
        )
        .join("|"),
    [parts],
  );

  useEffect(() => {
    if (parts.length === 0) {
      setPartScenes([]);
      return;
    }
    setPartScenes([]);
  }, [partsKey, parts.length]);

  const composedScene = useMemo(() => {
    const root = baseScene;
    root.name = "ProductRoot";

    const activeHidePatterns = partScenes.length > 0 ? hideBaseMeshPatterns : [];
    applyBaseMeshVisibility(root, activeHidePatterns);
    clearPartAttachments(root);

    for (const part of partScenes) {
      const slot = part.slotName ? root.getObjectByName(part.slotName) : null;
      part.scene.userData = {
        ...part.scene.userData,
        __partAttachment: true,
      };
      if (slot) {
        slot.add(part.scene);
      } else {
        root.add(part.scene);
      }
    }

    const data = root.userData as { __normalized?: boolean };
    if (!data.__normalized) {
      normalizeScene(root);
      data.__normalized = true;
    }

    return root;
  }, [baseScene, partScenes, hideBaseMeshPatterns]);

  const partScenesKey = useMemo(
    () =>
      partScenes
        .map((part) => `${part.id}:${part.variantId}:${part.scene.uuid}`)
        .join("|"),
    [partScenes],
  );

  useMaterialBindings({
    scene: composedScene,
    materialLibrary,
    enabled: !debugMode,
    refreshKey: partScenesKey,
    ...(schema !== undefined ? { schema } : {}),
    ...(selections !== undefined ? { selections } : {}),
  });

  useEffect(() => {
    if (!debugMode) return;
    const debugMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
    composedScene.traverse((node: THREE.Object3D) => {
      if (!(node as THREE.Mesh).isMesh) return;
      const mesh = node as THREE.Mesh;
      const data = mesh.userData as {
        __debugOriginalMaterial?: THREE.Material | THREE.Material[];
        __debugOriginalFrustum?: boolean;
      };
      if (!data.__debugOriginalMaterial) {
        data.__debugOriginalMaterial = mesh.material;
        data.__debugOriginalFrustum = mesh.frustumCulled;
      }
      mesh.material = debugMaterial;
      mesh.frustumCulled = false;
    });
    return () => {
      composedScene.traverse((node: THREE.Object3D) => {
        if (!(node as THREE.Mesh).isMesh) return;
        const mesh = node as THREE.Mesh;
        const data = mesh.userData as {
          __debugOriginalMaterial?: THREE.Material | THREE.Material[];
          __debugOriginalFrustum?: boolean;
        };
        if (data.__debugOriginalMaterial) {
          mesh.material = data.__debugOriginalMaterial;
          mesh.frustumCulled = data.__debugOriginalFrustum ?? mesh.frustumCulled;
          delete data.__debugOriginalMaterial;
          delete data.__debugOriginalFrustum;
        }
      });
      debugMaterial.dispose();
    };
  }, [composedScene, debugMode]);

  useEffect(() => {
    onSceneReady(composedScene);
    onBoundsReady(computeBounds(composedScene));
    onAnimationsReady?.(baseGltf.animations ?? []);
  }, [
    composedScene,
    baseGltf.animations,
    onSceneReady,
    onBoundsReady,
    onAnimationsReady,
  ]);

  useEffect(() => {
    if (!debugMode) return;
    const info = {
      baseChildren: baseScene.children.length,
      baseMeshes: countMeshes(baseScene),
      composedMeshes: countMeshes(composedScene),
      gltfSceneName: baseGltf.scene?.name ?? "unnamed",
      gltfScenes: baseGltf.scenes?.length ?? 0,
      baseChildNames: baseScene.children.map((child) => child.name),
      composedChildren: composedScene.children.length,
      composedChildNames: composedScene.children.map((child) => child.name),
      baseIsComposedChild: composedScene.children.includes(baseScene),
    };
    console.info(
      "[handbag-debug] gltf scene summary" /* i18n-exempt -- HB-1120 [ttl=2026-12-31] debug log label */,
      info,
    );
    if (typeof window !== "undefined") {
      (window as Window & { __handbagDebug?: unknown }).__handbagDebug = {
        baseGltf,
        baseScene,
        composedScene,
        partScenes,
      };
    }
  }, [debugMode, baseGltf, baseScene, composedScene, partScenes]);

  return (
    <>
      {parts.length > 0 ? (
        <PartErrorBoundary key={partsKey}>
          <Suspense fallback={null}>
            <PartLoader parts={parts} onReady={setPartScenes} />
          </Suspense>
        </PartErrorBoundary>
      ) : null}
      <primitive object={composedScene} dispose={null} />
    </>
  );
}
