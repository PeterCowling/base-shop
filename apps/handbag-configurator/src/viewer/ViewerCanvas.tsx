"use client";

import { useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type {
  ProductConfigSchema,
  ProductHotspotConfig,
  SelectionState,
} from "@acme/product-configurator";
import {
  Component,
  type PointerEvent,
  type ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as THREE from "three";
import { useTieredProductAsset } from "./assets/useTieredProductAsset";
import { BagAnimationController } from "./animation/BagAnimationController";
import { CameraController, type FrameBounds } from "./controls/CameraController";
import { HotspotManager } from "./hotspots/HotspotManager";
import { HotspotOverlay } from "./hotspots/HotspotOverlay";
import type { VisibleHotspot } from "./hotspots/useHotspotVisibility";
import { configureRenderer } from "./rendering/rendererConfig";
import { LightingRig } from "./rendering/LightingRig";
import { LookdevObjects } from "./rendering/LookdevObjects";
import { ComposedModelScene } from "./rendering/ComposedModelScene";
import { useModeStore } from "./state/modeStore";

function DebugHelpers() {
  const axes = useMemo(() => new THREE.AxesHelper(1.5), []);
  return (
    <>
      <primitive object={axes} />
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshNormalMaterial />
      </mesh>
    </>
  );
}

type ViewerCanvasProps = {
  productId: string;
  schema?: ProductConfigSchema;
  selections?: SelectionState;
  hotspotConfig?: ProductHotspotConfig | null;
  onPersistHotspotOffsets?: (offsets: Record<string, { x: number; y: number }>) => void;
  showLookdevObjects?: boolean;
  modelOverrideUrl?: string;
  hideTierControls?: boolean;
  onInteraction?: () => void;
  frameMode?: string;
  frameOffsetScale?: { x: number; y: number; z?: number };
  frameTightness?: number;
  frameFit?: "contain" | "height" | "width";
};

function LoadingOverlay({ label }: { label: string }) {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 text-xs uppercase tracking-[0.3em] text-white">
      {label} {Math.round(progress)}%
    </div>
  );
}

class ModelErrorBoundary extends Component<
  { onError: (message: string) => void; children: ReactNode },
  { hasError: boolean }
> {
  override state: { hasError: boolean } = { hasError: false };

  static getDerivedStateFromError(_error: Error) {
    return { hasError: true };
  }

  override componentDidCatch(error: Error) {
    this.props.onError(error.message);
  }

  override render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function ViewerCanvas({
  productId,
  schema,
  selections,
  hotspotConfig,
  onPersistHotspotOffsets,
  showLookdevObjects = false,
  modelOverrideUrl,
  hideTierControls = false,
  onInteraction,
  frameMode,
  frameOffsetScale,
  frameTightness,
  frameFit,
}: ViewerCanvasProps) {
  const [debugMode, setDebugMode] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setDebugMode(new URLSearchParams(window.location.search).has("debug"));
  }, []);
  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const [bounds, setBounds] = useState<FrameBounds | null>(null);
  const [animations, setAnimations] = useState<THREE.AnimationClip[]>([]);
  const [modelError, setModelError] = useState<string | null>(null);
  const [visibleHotspots, setVisibleHotspots] = useState<VisibleHotspot[]>([]);
  const bagOpen = useModeStore((state) => state.bagOpen);
  const closePanel = useModeStore((state) => state.closePanel);
  const clearActiveRegion = useModeStore((state) => state.clearActiveRegion);
  const hotspotConfigMode = useModeStore((state) => state.hotspotConfigMode);
  const {
    setPreferredTier,
    effectiveTier,
    hdAllowed,
    modelUrl,
    parts,
    hideBaseMeshPatterns,
    hdriUrl,
    posterUrl,
    animationMap,
    proceduralOpen,
  } = useTieredProductAsset(productId, {
    ...(schema !== undefined ? { schema } : {}),
    ...(selections !== undefined ? { selections } : {}),
  });
  const activeModelUrl = modelOverrideUrl ?? modelUrl;
  const activeParts = modelOverrideUrl ? [] : parts;
  const activeAnimationMap = modelOverrideUrl ? undefined : animationMap;
  const activeProceduralOpen = modelOverrideUrl ? undefined : proceduralOpen;
  const activeHideBaseMeshPatterns = modelOverrideUrl
    ? []
    : hideBaseMeshPatterns;
  const showTierControls = !hideTierControls && !modelOverrideUrl;
  const partsKey = useMemo(
    () =>
      activeParts
        .map(
          (part) =>
            `${part.id}:${part.variantId}:${part.url}:${part.slotName ?? ""}`,
        )
        .join("|"),
    [activeParts],
  );
  const errorKey = `${activeModelUrl}:${partsKey}`;

  const toggleTier = () => {
    if (!hdAllowed || modelOverrideUrl) return;
    setPreferredTier(effectiveTier === "desktop" ? "mobile" : "desktop");
  };

  useEffect(() => {
    setModelError(null);
    setVisibleHotspots([]);
  }, [activeModelUrl, partsKey]);

  const [debugInfo, setDebugInfo] = useState<{
    meshCount: number;
    visibleMeshCount: number;
    boundsEmpty: boolean;
    boundsSize: string;
  } | null>(null);

  useEffect(() => {
    if (!debugMode) return;
    if (!scene) {
      const nextInfo = {
        meshCount: 0,
        visibleMeshCount: 0,
        boundsEmpty: true,
        boundsSize: "n/a",
      };
      setDebugInfo(nextInfo);
      console.info("[handbag-debug] scene missing", nextInfo);
      return;
    }
    let meshCount = 0;
    let visibleMeshCount = 0;
    scene.traverse((node) => {
      if (!(node as THREE.Mesh).isMesh) return;
      meshCount += 1;
      if ((node as THREE.Mesh).visible) visibleMeshCount += 1;
    });
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const nextInfo = {
      meshCount,
      visibleMeshCount,
      boundsEmpty: box.isEmpty(),
      boundsSize: `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`,
    };
    setDebugInfo(nextInfo);
    console.info("[handbag-debug] scene info", nextInfo);
  }, [debugMode, scene]);

  const tierBadge = effectiveTier === "desktop" ? "HD Preview" : "Mobile Tier";
  const handleCanvasPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (hotspotConfigMode) return;
    if (!(event.target instanceof HTMLCanvasElement)) return;
    closePanel();
    clearActiveRegion();
  };

  return (
    <div
      className="relative h-full w-full flex-1 min-h-0"
      onPointerDown={handleCanvasPointerDown}
    >
      <Canvas
        onCreated={({ gl }) => configureRenderer(gl)}
        camera={{ position: [0, 0.35, 3.2], fov: 32 }}
        className="h-full w-full"
        style={{ touchAction: "none" }}
      >
        <ModelErrorBoundary
          key={errorKey}
          onError={() => setModelError("Model failed to load")}
        >
          <Suspense fallback={null}>
            <LightingRig hdriUrl={hdriUrl} />
            <ComposedModelScene
              baseUrl={activeModelUrl}
              parts={activeParts}
              hideBaseMeshPatterns={activeHideBaseMeshPatterns}
              {...(schema !== undefined ? { schema } : {})}
              {...(selections !== undefined ? { selections } : {})}
              debugMode={debugMode}
              onSceneReady={setScene}
              onBoundsReady={setBounds}
              onAnimationsReady={setAnimations}
            />
            {debugMode ? <DebugHelpers /> : null}
            {showLookdevObjects ? <LookdevObjects /> : null}
          </Suspense>
        </ModelErrorBoundary>
        <BagAnimationController
          scene={scene}
          clips={animations}
          isOpen={bagOpen}
          {...(activeProceduralOpen ? { proceduralOpen: activeProceduralOpen } : {})}
          {...(activeAnimationMap?.["open"]
            ? { openClipName: activeAnimationMap["open"] }
            : {})}
          {...(activeAnimationMap?.["close"]
            ? { closeClipName: activeAnimationMap["close"] }
            : {})}
        />
        <CameraController
          bounds={bounds}
          frameKey={`${activeModelUrl}-${partsKey}-${frameMode ?? "default"}`}
          {...(frameOffsetScale !== undefined ? { frameOffsetScale } : {})}
          {...(frameTightness !== undefined ? { frameTightness } : {})}
          {...(frameFit !== undefined ? { frameFit } : {})}
          {...(onInteraction ? { onInteraction } : {})}
        />
        <HotspotManager
          scene={scene}
          onHotspotsChange={setVisibleHotspots}
          {...(hotspotConfig !== undefined ? { hotspotConfig } : {})}
          {...(schema ? { schema } : {})}
        />
      </Canvas>

      <HotspotOverlay
        hotspots={visibleHotspots}
        {...(hotspotConfig !== undefined ? { hotspotConfig } : {})}
        {...(onPersistHotspotOffsets
          ? { onPersistOffsets: onPersistHotspotOffsets }
          : {})}
      />
      <LoadingOverlay label="Loading model" />
      {modelError ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/70 text-center text-xs uppercase tracking-[0.3em] text-white">
          {modelError}
        </div>
      ) : null}
      {debugMode ? (
        <div
          className="pointer-events-none z-50 rounded-md px-3 py-2 text-[12px]"
          style={{
            position: "fixed",
            top: "72px",
            left: "12px",
            background: "rgba(0, 0, 0, 0.82)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
          }}
        >
          <div>debug=1</div>
          <div>meshes: {debugInfo?.meshCount ?? 0}</div>
          <div>visible: {debugInfo?.visibleMeshCount ?? 0}</div>
          <div>bounds: {debugInfo?.boundsEmpty ? "empty" : debugInfo?.boundsSize}</div>
        </div>
      ) : null}

      {showTierControls ? (
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
          <div className="pointer-events-none flex items-center gap-3 rounded-full border border-border-1 bg-panel/85 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            <span>{tierBadge}</span>
          </div>
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-border-2 bg-surface-2/80 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={toggleTier}
              disabled={!hdAllowed}
              aria-disabled={!hdAllowed}
            >
              {effectiveTier === "desktop" ? "Use Mobile" : "HD Preview"}
            </button>
            <a
              href={posterUrl}
              className="hidden rounded-full border border-border-1 bg-surface-2/70 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:bg-surface-3 md:inline-flex"
            >
              Poster
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
