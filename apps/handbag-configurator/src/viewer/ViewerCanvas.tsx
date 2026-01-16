"use client";

import { useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type {
  ProductConfigSchema,
  ProductHotspotConfig,
  SelectionState,
} from "@acme/product-configurator";
import { useTranslations } from "@acme/i18n";
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

function LoadingOverlay({
  label,
  progress,
}: {
  label: string;
  progress: number;
}) {
  return (
    <div className="pointer-events-none col-start-1 row-start-1 flex h-full w-full items-center justify-center bg-black/60 text-xs uppercase tracking-widest text-white">
      <span>
        {label} {Math.round(progress)}%
      </span>
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
  const t = useTranslations();
  const { active: isLoading, progress } = useProgress();
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
  const activeParts = useMemo(
    () => (modelOverrideUrl ? [] : parts),
    [modelOverrideUrl, parts],
  );
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
      console.info(
        "[handbag-debug] scene missing" /* i18n-exempt -- HB-1120 [ttl=2026-12-31] debug log label */,
        nextInfo,
      );
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
    console.info(
      "[handbag-debug] scene info" /* i18n-exempt -- HB-1120 [ttl=2026-12-31] debug log label */,
      nextInfo,
    );
  }, [debugMode, scene]);

  const tierBadge =
    effectiveTier === "desktop"
      ? t("handbag.viewer.tierBadgeHd")
      : t("handbag.viewer.tierBadgeMobile");
  const tierToggleLabel =
    effectiveTier === "desktop"
      ? t("handbag.viewer.switchToMobile")
      : t("handbag.viewer.switchToHd");
  const handleCanvasPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (hotspotConfigMode) return;
    if (!(event.target instanceof HTMLCanvasElement)) return;
    closePanel();
    clearActiveRegion();
  };

  return (
    <div
      className="relative grid h-full w-full flex-1 min-h-0"
      onPointerDown={handleCanvasPointerDown}
    >
      <Canvas
        onCreated={({ gl }) => configureRenderer(gl)}
        camera={{ position: [0, 0.35, 3.2], fov: 32 }}
        className="col-start-1 row-start-1 h-full w-full"
        style={{ touchAction: "none" }}
      >
        <ModelErrorBoundary
          key={errorKey}
          onError={() => setModelError(t("handbag.viewer.modelLoadFailed"))}
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
      {isLoading ? (
        <LoadingOverlay
          label={t("handbag.viewer.loadingModel")}
          progress={progress}
        />
      ) : null}
      {modelError ? (
        <div className="pointer-events-none col-start-1 row-start-1 flex h-full w-full items-center justify-center bg-black/70 text-center text-xs uppercase tracking-widest text-white">
          <span>{modelError}</span>
        </div>
      ) : null}
      {debugMode ? (
        <div
          className="pointer-events-none fixed start-3 top-20 rounded-md border border-border-1 bg-panel/90 px-3 py-2 text-xs font-mono text-foreground shadow-elevation-2"
        >
          <div>{t("handbag.debug.label")}</div>
          <div>
            {t("handbag.debug.meshes")}: {debugInfo?.meshCount ?? 0}
          </div>
          <div>
            {t("handbag.debug.visible")}: {debugInfo?.visibleMeshCount ?? 0}
          </div>
          <div>
            {t("handbag.debug.bounds")}:{" "}
            {debugInfo?.boundsEmpty
              ? t("handbag.debug.empty")
              : debugInfo?.boundsSize}
          </div>
        </div>
      ) : null}

      {showTierControls ? (
        <div className="absolute bottom-6 start-6 end-6 flex items-center justify-between">
          <div className="pointer-events-none flex items-center gap-3 rounded-full border border-border-1 bg-panel/85 px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground">
            <span>{tierBadge}</span>
          </div>
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              type="button"
              className="min-h-12 min-w-12 rounded-full border border-border-2 bg-surface-2/80 px-4 py-2 text-xs uppercase tracking-widest text-foreground transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={toggleTier}
              disabled={!hdAllowed}
              aria-disabled={!hdAllowed}
            >
              {tierToggleLabel}
            </button>
            <a
              href={posterUrl}
              className="hidden min-h-12 min-w-12 rounded-full border border-border-1 bg-surface-2/70 px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground transition hover:bg-surface-3 md:inline-flex"
            >
              {t("handbag.viewer.poster")}
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
