"use client";

import {
  Component,
  type PointerEvent,
  type ReactNode,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useProgress } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { useTranslations } from "@acme/i18n";
import type {
  ProductConfigSchema,
  ProductHotspotConfig,
  SelectionState,
} from "@acme/product-configurator";

import { BagAnimationController } from "./animation/BagAnimationController";
import { useTieredProductAsset } from "./assets/useTieredProductAsset";
import { CameraController, type FrameBounds } from "./controls/CameraController";
import { HotspotManager } from "./hotspots/HotspotManager";
import { HotspotOverlay } from "./hotspots/HotspotOverlay";
import type { VisibleHotspot } from "./hotspots/useHotspotVisibility";
import { ComposedModelScene } from "./rendering/ComposedModelScene";
import { LightingRig } from "./rendering/LightingRig";
import { LookdevObjects } from "./rendering/LookdevObjects";
import { configureRenderer } from "./rendering/rendererConfig";
import { useModeStore } from "./state/modeStore";

const DEBUG_LOG_PREFIX = "[handbag-debug]"; // i18n-exempt -- HAND-0002 [ttl=2026-12-31]: debug log tag, not user-facing copy.
const DEBUG_LABEL = "debug=1"; // i18n-exempt -- HAND-0006 [ttl=2026-12-31]: debug indicator text, not user copy.
const DEBUG_MESHES_LABEL =
  "meshes:"; // i18n-exempt -- HAND-0006 [ttl=2026-12-31]: debug metric label, not user copy.
const DEBUG_VISIBLE_LABEL =
  "visible:"; // i18n-exempt -- HAND-0006 [ttl=2026-12-31]: debug metric label, not user copy.
const DEBUG_BOUNDS_LABEL =
  "bounds:"; // i18n-exempt -- HAND-0006 [ttl=2026-12-31]: debug metric label, not user copy.
const DEBUG_BOUNDS_EMPTY =
  "empty"; // i18n-exempt -- HAND-0006 [ttl=2026-12-31]: placeholder status for bounds, not user copy.

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
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 text-xs uppercase handbag-tracking-label text-white">
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
  const activeParts = useMemo(
    () => (modelOverrideUrl ? [] : parts),
    [modelOverrideUrl, parts],
  );
  const activeAnimationMap = useMemo(
    () => (modelOverrideUrl ? undefined : animationMap),
    [modelOverrideUrl, animationMap],
  );
  const activeProceduralOpen = useMemo(
    () => (modelOverrideUrl ? undefined : proceduralOpen),
    [modelOverrideUrl, proceduralOpen],
  );
  const activeHideBaseMeshPatterns = useMemo(
    () => (modelOverrideUrl ? [] : hideBaseMeshPatterns),
    [modelOverrideUrl, hideBaseMeshPatterns],
  );
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
  const t = useTranslations();

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
      console.info(DEBUG_LOG_PREFIX, nextInfo);
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
    console.info(DEBUG_LOG_PREFIX, nextInfo);
  }, [debugMode, scene]);

  const tierBadge =
    effectiveTier === "desktop"
      ? t("handbagConfigurator.badge.hdPreview")
      : t("handbagConfigurator.badge.mobileTier");
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
          onError={() => setModelError(t("handbagConfigurator.errors.modelLoadFailed"))}
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
      <LoadingOverlay label={t("handbagConfigurator.overlay.loadingModel")} />
      {modelError ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/70 text-center text-xs uppercase handbag-tracking-label text-white">
          {modelError}
        </div>
      ) : null}
      {debugMode ? (
        <div
          className="pointer-events-none z-50 rounded-md px-3 py-2 text-xs"
          style={{
            position: "fixed", // i18n-exempt -- HAND-0007 [ttl=2026-12-31]: debug-only styling, not UI copy.
            top: "72px", // i18n-exempt -- HAND-0007 [ttl=2026-12-31]: debug-only styling, not UI copy.
            left: "12px", // i18n-exempt -- HAND-0007 [ttl=2026-12-31]: debug-only styling, not UI copy.
            background: "rgba(0, 0, 0, 0.82)", // i18n-exempt -- HAND-0007 [ttl=2026-12-31]: debug-only styling, not UI copy.
            color: "#ffffff", // i18n-exempt -- HAND-0007 [ttl=2026-12-31]: debug-only styling, not UI copy.
            border: "1px solid rgba(255, 255, 255, 0.25)", // i18n-exempt -- HAND-0007 [ttl=2026-12-31]: debug-only styling, not UI copy.
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace", // i18n-exempt -- HAND-0007 [ttl=2026-12-31]: debug-only styling, not UI copy.
          }}
        >
          <div>{DEBUG_LABEL}</div>
          <div>
            {DEBUG_MESHES_LABEL} {debugInfo?.meshCount ?? 0}
          </div>
          <div>
            {DEBUG_VISIBLE_LABEL} {debugInfo?.visibleMeshCount ?? 0}
          </div>
          <div>
            {DEBUG_BOUNDS_LABEL}{" "}
            {debugInfo?.boundsEmpty ? DEBUG_BOUNDS_EMPTY : debugInfo?.boundsSize}
          </div>
        </div>
      ) : null}

      {showTierControls ? (
        <div className="absolute bottom-6 start-6 end-6 flex items-center justify-between">
          <div className="pointer-events-none flex items-center gap-3 rounded-full border border-border-1 bg-panel/85 px-4 py-2 text-xs uppercase handbag-tracking-label text-muted-foreground">
            <span>{tierBadge}</span>
          </div>
          <div className="pointer-events-auto flex items-center gap-3">
              <button
                type="button"
                className="min-h-11 min-w-11 rounded-full border border-border-2 bg-surface-2/80 px-4 py-2 text-xs uppercase handbag-tracking-tight text-foreground transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={toggleTier}
                disabled={!hdAllowed}
                aria-disabled={!hdAllowed}
              >
                {effectiveTier === "desktop"
                  ? t("handbagConfigurator.button.useMobile")
                  : t("handbagConfigurator.button.hdPreview")}
              </button>
            <a
              href={posterUrl}
              className="hidden min-h-11 min-w-11 rounded-full border border-border-1 bg-surface-2/70 px-3 py-2 text-xs uppercase handbag-tracking-tight text-muted-foreground transition hover:bg-surface-3 md:inline-flex"
            >
              {t("handbagConfigurator.button.poster")}
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
