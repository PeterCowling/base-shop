"use client";

import { renderShadow } from "@acme/lib/tryon/fallback/shadow";

type Overlay = { x: number; y: number; scale: number; rot: number };

export async function drawPreview(args: {
  ctx: CanvasRenderingContext2D;
  cssW: number;
  cssH: number;
  baseUrl: string;
  accessoryUrl: string | null;
  overlay: Overlay;
  maskUrl: string | null;
}): Promise<void> {
  const { ctx, cssW, cssH, baseUrl, accessoryUrl, overlay, maskUrl } = args;
  const base = await loadImage(baseUrl);
  ctx.clearRect(0, 0, cssW, cssH);
  const maxW = cssW, maxH = cssH;
  const ratio = Math.min(maxW / base.width, maxH / base.height);
  const bw = Math.round(base.width * ratio);
  const bh = Math.round(base.height * ratio);
  const bx = (maxW - bw) / 2;
  const by = (maxH - bh) / 2;
  ctx.drawImage(base, bx, by, bw, bh);

  if (!accessoryUrl) return;
  const overlayImg = await loadImage(accessoryUrl);
  const ow = Math.round(overlayImg.width * overlay.scale * 0.4);
  const oh = Math.round(overlayImg.height * overlay.scale * 0.4);

  // Draw overlay into offscreen to allow mask occlusion
  const oc = document.createElement('canvas');
  oc.width = cssW; oc.height = cssH;
  const octx = oc.getContext('2d');
  if (!octx) return;
  // Shadow
  renderShadow(octx as any, { x: overlay.x, y: overlay.y, width: ow, height: oh }, { opacity: 0.3, scale: 1, angleDeg: 35 });
  // Overlay bitmap with rotation around center
  octx.save();
  octx.translate(overlay.x + ow / 2, overlay.y + oh / 2);
  octx.rotate((overlay.rot * Math.PI) / 180);
  octx.translate(-ow / 2, -oh / 2);
  octx.drawImage(overlayImg, 0, 0, ow, oh);
  octx.restore();

  // Apply occlusion by erasing where body mask is present
  if (maskUrl) {
    try {
      const mask = await loadImage(maskUrl);
      octx.save();
      octx.globalCompositeOperation = 'destination-out';
      // Scale mask to the same rect as base image placement
      octx.drawImage(mask, bx, by, bw, bh);
      octx.restore();
    } catch {}
  }
  // Composite onto main
  ctx.drawImage(oc, 0, 0, cssW, cssH);
}

export async function computeSmartAnchor(args: {
  cssW: number; cssH: number; baseUrl: string; maskUrl: string; accessoryUrl: string; scale: number; depthUrl?: string | null; anchorHint?: 'head'|'torso'|'feet';
}): Promise<{ x: number; y: number; scale?: number } | null> {
  const { cssW, cssH, baseUrl, maskUrl, accessoryUrl, scale, depthUrl, anchorHint } = args;
  const [base, mask, accessory] = await Promise.all([loadImage(baseUrl), loadImage(maskUrl), loadImage(accessoryUrl)]);
  const ratio = Math.min(cssW / base.width, cssH / base.height);
  const bw = Math.round(base.width * ratio);
  const bh = Math.round(base.height * ratio);
  const bx = Math.round((cssW - bw) / 2);
  const by = Math.round((cssH - bh) / 2);
  // Draw mask into offscreen scaled to placement
  const mc = document.createElement('canvas');
  mc.width = cssW; mc.height = cssH;
  const mctx = mc.getContext('2d');
  if (!mctx) return null;
  mctx.drawImage(mask, bx, by, bw, bh);
  const { data, width, height } = mctx.getImageData(0, 0, cssW, cssH);
  let minX = width, minY = height, maxX = 0, maxY = 0; let found = false;
  const stride = 4; // rgba
  const step = 4; // sample stride to speed up
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * stride;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
      const v = a > 127 || (r + g + b) / 3 > 127; // treat bright/opaque as body
      if (v) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return null;
  const ow = Math.round(accessory.width * scale * 0.4);
  const oh = Math.round(accessory.height * scale * 0.4);
  // Place based on hint: head ~0.2, torso ~0.5, feet ~0.85 of body bbox
  const centerX = Math.round((minX + maxX) / 2);
  let fraction = 0.28;
  if (anchorHint === 'torso') fraction = 0.5;
  else if (anchorHint === 'feet') fraction = 0.85;
  else if (anchorHint === 'head') fraction = 0.18;
  const anchorY = Math.round(minY + (maxY - minY) * fraction);
  const x = clamp(centerX - Math.round(ow / 2), 0, cssW - ow);
  const y = clamp(anchorY - Math.round(oh / 2), 0, cssH - oh);
  // Optional depth-based scale tweak (±10%) based on brightness at anchor
  if (depthUrl) {
    try {
      const depth = await loadImage(depthUrl);
      const dc = document.createElement('canvas'); dc.width = cssW; dc.height = cssH;
      const dctx = dc.getContext('2d');
      if (dctx) {
        dctx.drawImage(depth, bx, by, bw, bh);
        const sample = dctx.getImageData(clamp(centerX,0,cssW-1), clamp(anchorY,0,cssH-1), 1, 1).data;
        const brightness = (sample[0] + sample[1] + sample[2]) / (3 * 255);
        const scaleAdj = 0.9 + brightness * 0.2; // 0.9..1.1
        return { x, y, scale: Number((scale * scaleAdj).toFixed(3)) };
      }
    } catch {}
  }
  return { x, y };
}

// Simple in-memory image cache with in-flight de-duplication
const IMG_CACHE = new Map<string, HTMLImageElement>();
const INFLIGHT = new Map<string, Promise<HTMLImageElement>>();

async function loadImage(src: string): Promise<HTMLImageElement> {
  const key = String(src);
  const cached = IMG_CACHE.get(key);
  if (cached) return cached;
  const inflight = INFLIGHT.get(key);
  if (inflight) return inflight;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { IMG_CACHE.set(key, img); INFLIGHT.delete(key); resolve(img); };
    img.onerror = (e) => { INFLIGHT.delete(key); reject(e as any); };
    img.src = key;
  });
  INFLIGHT.set(key, p);
  return p;
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
