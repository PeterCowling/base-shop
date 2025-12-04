"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SKU } from "@acme/types";
import type React from "react";
import { UploaderSurface } from "@ui/components/upload/UploaderSurface";
import type { ImageOrientation } from "@acme/types";
import { useTryOnController } from "@ui/hooks/tryon/useTryOnController";
import { tryonMeta } from "../../../../lib/tryonMeta";
import { ARViewer } from "@ui/components/atoms/ARViewer";
import { RecommendationCarousel } from "@ui/components/organisms";
import { useCart } from "@platform-core/contexts/CartContext";
import { ComparePreview } from "./ComparePreview";
import { SignedViewLink } from "./SignedViewLink";
import { TryOnStepper } from "./TryOnStepper";
import { useTranslations } from "@acme/i18n";
import { drawPreview, computeSmartAnchor } from "./PreviewUtils";
import { logAnalyticsEvent } from "@platform-core/analytics/client";

interface Props { product: SKU }

export default function TryOnPanel({ product }: Props) {
  const ctrl = useTryOnController();
  const t = useTranslations();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requiredOrientation: ImageOrientation = "landscape" as const;
  const accessoryUrl = useMemo(() => product.media.find(m => m.type === 'image')?.url, [product.media]);
  const assets3d = tryonMeta[product.slug]?.assets3d;
  const [recs, setRecs] = useState<SKU[]>([]);

  const openFileDialog = useCallback(() => inputRef.current?.click(), []);
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setIsVideo(file.type.startsWith("video/"));
    setIsValid(file.type.startsWith("image/"));
    setPendingFile(file);
  }, []);
  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    if (!file) return;
    setIsVideo(file.type.startsWith("video/"));
    setIsValid(file.type.startsWith("image/"));
    setPendingFile(file);
  }, []);

  const [overlay, setOverlay] = useState({ x: 50, y: 50, scale: 1.0, rot: 0 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [dpr, setDpr] = useState(1);
  const [wasAdjusted, setWasAdjusted] = useState(false);

  // Setup canvas for devicePixelRatio for crisp rendering
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const resize = () => {
      const cssW = Math.max(1, c.clientWidth);
      const cssH = Math.max(1, c.clientHeight);
      const nextDpr = Math.max(1, Math.min(3, Math.floor((globalThis.devicePixelRatio || 1) * 1.0)));
      setDpr(nextDpr);
      c.width = Math.round(cssW * nextDpr);
      c.height = Math.round(cssH * nextDpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    const onDpr = () => resize();
    globalThis.matchMedia?.(`(resolution: ${globalThis.devicePixelRatio || 1}dppx)`)?.addEventListener?.('change', onDpr);
    return () => {
      try { ro.disconnect(); } catch {}
    };
  }, []);

  const startUpload = useCallback(async () => {
    if (!pendingFile || !pendingFile.type.startsWith("image/")) return;
    const { objectUrl, jobId } = await ctrl.startUpload(pendingFile, { productId: product.slug, mode: 'accessory' });
    await ctrl.preprocess({ imageUrl: objectUrl, jobId });
  }, [pendingFile, ctrl, product.slug]);

  const startEnhance = useCallback(async () => {
    if (!ctrl.state.sourceImageUrl) return;
    const meta = tryonMeta[product.slug] || {};
    const garmentAssets = { flatUrl: meta.tryOn?.garmentFlat, exemplarUrl: meta.tryOn?.onModelExemplar };
    await ctrl.enhance({
      mode: 'garment',
      productId: product.slug,
      sourceImageUrl: ctrl.state.sourceImageUrl,
      garmentAssets,
      maskUrl: ctrl.state.maskUrl,
      depthUrl: ctrl.state.depthUrl,
      poseUrl: ctrl.state.poseUrl,
    });
  }, [ctrl, product.slug]);

  // Try similar (fetch simple recommendations)
  useEffect(() => {
    let ignore = false;
    fetch(`/api/recommendations?seed=${encodeURIComponent(product.slug)}&limit=4`)
      .then(r => r.json())
      .then((d) => {
        if (ignore) return;
        const items = Array.isArray(d?.items) ? d.items : [];
        setRecs(items as SKU[]);
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, [product.slug]);

  const [, dispatch] = useCart();
  const addToCartWithTag = useCallback(async () => {
    await dispatch({ type: 'add', sku: product, qty: 1, meta: { source: 'try-on', tryOn: { idempotencyKey: ctrl.state.jobId, transform: overlay } } });
    void logAnalyticsEvent({ type: "add_to_cart", productId: product.slug, source: "try-on" });
  }, [dispatch, product, ctrl.state.jobId, overlay]);

  // Render preview when available (occlusion aware) — rAF-throttled
  const animRef = useRef<number | null>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || ctrl.state.phase === 'idle') return;
    const url = ctrl.state.sourceImageUrl;
    if (!url) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let cancelled = false;
    if (animRef.current != null) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(async () => {
      if (cancelled) return;
      const cssW = Math.max(1, c.clientWidth);
      const cssH = Math.max(1, c.clientHeight);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      try {
        await drawPreview({ ctx, cssW, cssH, baseUrl: url, accessoryUrl: accessoryUrl || null, overlay, maskUrl: ctrl.state.maskUrl || null });
      } catch {}
    });
    return () => { cancelled = true; if (animRef.current != null) cancelAnimationFrame(animRef.current); };
  }, [ctrl.state.phase, ctrl.state.sourceImageUrl, accessoryUrl, overlay, dpr, ctrl.state.maskUrl]);

  // Smart anchor using segmentation (run once unless user adjusts)
  useEffect(() => {
    (async () => {
      const c = canvasRef.current;
      if (!c || wasAdjusted) return;
      if (!ctrl.state.maskUrl || !accessoryUrl || !ctrl.state.sourceImageUrl) return;
      try {
        const cssW = Math.max(1, c.clientWidth);
        const cssH = Math.max(1, c.clientHeight);
        const anchorHint = tryonMeta[product.slug]?.anchorHint;
        const pos = await computeSmartAnchor({ cssW, cssH, baseUrl: ctrl.state.sourceImageUrl, maskUrl: ctrl.state.maskUrl, accessoryUrl, scale: overlay.scale, depthUrl: ctrl.state.depthUrl, anchorHint });
        if (pos) setOverlay(o => ({ ...o, x: pos.x, y: pos.y, scale: pos.scale ?? o.scale }));
      } catch {}
    })();
  }, [ctrl.state.maskUrl, accessoryUrl, ctrl.state.sourceImageUrl, overlay.scale, wasAdjusted, ctrl.state.depthUrl, product.slug]);

  // Pointer + wheel + keyboard interactions on canvas
  const onCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; if (!c) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    setWasAdjusted(true);
  }, []);
  const onCanvasPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart.current) return;
    const dx = (e.clientX - dragStart.current.x);
    const dy = (e.clientY - dragStart.current.y);
    dragStart.current = { x: e.clientX, y: e.clientY };
    setOverlay(o => ({ ...o, x: Math.max(0, Math.min((canvasRef.current?.clientWidth || 512) - 10, o.x + dx)), y: Math.max(0, Math.min((canvasRef.current?.clientHeight || 512) - 10, o.y + dy)) }));
  }, [isDragging]);
  const onCanvasPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    dragStart.current = null;
    try { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); } catch {}
  }, []);
  const onCanvasWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    // Shift rotates instead of zooms
    if (e.shiftKey) {
      setOverlay(o => ({ ...o, rot: Math.max(-90, Math.min(90, o.rot + (e.deltaY < 0 ? 2 : -2))) }));
    } else {
      setOverlay(o => ({ ...o, scale: Math.max(0.5, Math.min(2.0, Number((o.scale + delta).toFixed(3)))) }));
    }
    setWasAdjusted(true);
  }, []);
  const onCanvasKeyDown = useCallback((e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowUp') { e.preventDefault(); setOverlay(o => ({ ...o, y: o.y - step })); setWasAdjusted(true); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setOverlay(o => ({ ...o, y: o.y + step })); setWasAdjusted(true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setOverlay(o => ({ ...o, x: o.x - step })); setWasAdjusted(true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setOverlay(o => ({ ...o, x: o.x + step })); setWasAdjusted(true); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); setOverlay(o => ({ ...o, scale: Math.min(2.0, o.scale + 0.05) })); setWasAdjusted(true); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); setOverlay(o => ({ ...o, scale: Math.max(0.5, o.scale - 0.05) })); setWasAdjusted(true); }
    else if (e.key.toLowerCase() === 'q') { e.preventDefault(); setOverlay(o => ({ ...o, rot: o.rot - 2 })); setWasAdjusted(true); }
    else if (e.key.toLowerCase() === 'e') { e.preventDefault(); setOverlay(o => ({ ...o, rot: o.rot + 2 })); setWasAdjusted(true); }
    else if (e.key.toLowerCase() === 'r') { e.preventDefault(); setOverlay({ x: 50, y: 50, scale: 1.0, rot: 0 }); setWasAdjusted(true); }
  }, []);

  return (
    <div className="mt-8 rounded border p-4">
      <h2 className="mb-2 text-xl font-semibold">{t("tryon.title")}</h2>
      <TryOnStepper phase={ctrl.state.phase} />
      <p className="mb-3 text-sm text-muted-foreground">{t("tryon.privacy")}</p>
      <UploaderSurface
        inputRef={inputRef}
        pendingFile={pendingFile}
        progress={ctrl.uploadProgress}
        error={ctrl.error ?? undefined}
        isValid={isValid}
        isVideo={isVideo}
        requiredOrientation={requiredOrientation}
        onDrop={onDrop}
        onFileChange={onFileChange}
        openFileDialog={openFileDialog}
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={startUpload}
          disabled={!pendingFile || isVideo}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-black px-3 py-1 text-white disabled:opacity-50"
        >{t("tryon.upload")}</button>
        {ctrl.state.sourceImageUrl && (
          <SignedViewLink objectUrl={ctrl.state.sourceImageUrl} label={t("tryon.viewUploaded") as string} />
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <canvas
          ref={canvasRef}
          width={512}
          height={512}
          tabIndex={0}
          aria-label={t("tryon.canvasLabel")}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onPointerCancel={onCanvasPointerUp}
          onWheel={onCanvasWheel}
          onKeyDown={onCanvasKeyDown}
          className="w-full rounded border outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        />
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{t("tryon.scale")}</label>
          <input type="range" min={50} max={200} value={overlay.scale * 100} onChange={(e) => { setOverlay(o => ({ ...o, scale: Number(e.target.value)/100 })); setWasAdjusted(true); }} />
          <label className="text-sm font-medium">{t("tryon.rotate")}</label>
          <input type="range" min={-45} max={45} value={overlay.rot} onChange={(e) => { setOverlay(o => ({ ...o, rot: Number(e.target.value) })); setWasAdjusted(true); }} />
          <label className="text-sm font-medium">{t("tryon.position")}</label>
          <div className="flex gap-2">
            <button
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-2"
              onClick={() => setOverlay(o => ({ ...o, y: o.y - 10 }))}
            >
              ↑
            </button>
            <button
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-2"
              onClick={() => setOverlay(o => ({ ...o, y: o.y + 10 }))}
            >
              ↓
            </button>
            <button
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-2"
              onClick={() => setOverlay(o => ({ ...o, x: o.x - 10 }))}
            >
              ←
            </button>
            <button
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-2"
              onClick={() => setOverlay(o => ({ ...o, x: o.x + 10 }))}
            >
              →
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-2 py-1 text-sm"
              onClick={() => { setOverlay({ x: 50, y: 50, scale: 1.0, rot: 0 }); setWasAdjusted(true); }}
            >
              {t("tryon.reset")}
            </button>
            <button
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-2 py-1 text-sm"
              onClick={async () => {
                try {
                  const c = canvasRef.current; if (!c || !ctrl.state.sourceImageUrl || !ctrl.state.maskUrl || !accessoryUrl) return;
                  const cssW = Math.max(1, c.clientWidth);
                  const cssH = Math.max(1, c.clientHeight);
                  const anchorHint = tryonMeta[product.slug]?.anchorHint;
                  const pos = await computeSmartAnchor({ cssW, cssH, baseUrl: ctrl.state.sourceImageUrl, maskUrl: ctrl.state.maskUrl, accessoryUrl, scale: overlay.scale, depthUrl: ctrl.state.depthUrl, anchorHint });
                  if (pos) setOverlay(o => ({ ...o, x: pos.x, y: pos.y, scale: pos.scale ?? o.scale }));
                } catch {}
              }}
            >{t("tryon.autoPlace")}</button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("tryon.readout.scale")}: {Math.round(overlay.scale * 100)}%</span>
              <span>{t("tryon.readout.rot")}: {Math.round(overlay.rot)}°</span>
              <span>{t("tryon.readout.pos")}: {Math.round(overlay.x)},{Math.round(overlay.y)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={startEnhance}
          disabled={!ctrl.state.sourceImageUrl || !ctrl.canEnhance}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-primary px-3 py-1 text-white disabled:opacity-50"
        >{t("tryon.enhance")}</button>
        {ctrl.state.phase === 'enhancing' && typeof ctrl.progress === 'number' && (
          <div className="h-2 w-48 rounded bg-muted">
            <div className="h-2 rounded bg-primary" style={{ width: `${Math.round((ctrl.progress as number) * 100)}%` }} />
          </div>
        )}
        {ctrl.state.phase === 'done' && ctrl.state.resultUrl && (
          <div className="flex items-center gap-3">
            <SignedViewLink objectUrl={ctrl.state.resultUrl} label={t("tryon.viewEnhanced") as string} />
            <ComparePreview baseUrl={ctrl.state.sourceImageUrl!} enhancedUrl={ctrl.state.resultUrl} />
          </div>
        )}
      </div>
      {assets3d && (assets3d.glb || assets3d.usdz) && (
        <div className="mt-6 rounded border p-4">
          <h3 className="mb-2 text-lg font-semibold">{t("tryon.viewInSpace")}</h3>
          <div className="h-64 w-full">
            <ARViewer src={assets3d.glb || assets3d.usdz!} ios-src={assets3d.usdz} />
          </div>
        </div>
      )}

      {/* Try similar carousel */}
      <div className="mt-6">
        <h3 className="mb-2 text-lg font-semibold">{t("tryon.trySimilar")}</h3>
        <RecommendationCarousel products={recs} showArrows showDots minItems={1} maxItems={4} tileMinHeight="20rem" />
      </div>

      {/* Add to Cart with try-on tag */}
      <div className="mt-4">
        <button
          type="button"
          onClick={addToCartWithTag}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded bg-emerald-600 px-3 py-1 text-white"
        >
          {t("tryon.addToCart")}
        </button>
        {ctrl.state.sourceImageUrl && (
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={openFileDialog}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-3 py-1"
            >
              {t("tryon.replacePhoto")}
            </button>
            <button
              type="button"
              onClick={() => ctrl.state.phase !== 'idle' && window.confirm(String(t("tryon.deleteConfirm"))) && (window.location.reload())}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-3 py-1"
            >
              {t("tryon.deletePhoto")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
// ComparePreview, SignedViewLink, and TryOnStepper extracted to keep this file focused and under line limit
