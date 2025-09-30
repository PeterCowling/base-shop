export interface ShadowOpts {
  opacity?: number; // 0..1
  scale?: number; // relative ellipse scale
  angleDeg?: number; // light angle; shadow offset
}

/**
 * Render a fast elliptical drop shadow under an anchor bounding box.
 * Designed to be deterministic and <50ms for typical canvas sizes.
 */
export function renderShadow(
  ctx: CanvasRenderingContext2D,
  anchor: { x: number; y: number; width: number; height: number },
  opts: ShadowOpts = {}
): void {
  const { opacity = 0.35, scale = 1.0, angleDeg = 35 } = opts;
  const cx = anchor.x + anchor.width / 2;
  const cy = anchor.y + anchor.height;
  const rx = (anchor.width * 0.55) * scale;
  const ry = (anchor.height * 0.18) * scale;
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad) * rx * 0.15;
  const dy = Math.sin(rad) * ry * 0.2;

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const grd = ctx.createRadialGradient(cx + dx, cy + dy, ry * 0.2, cx + dx, cy + dy, Math.max(rx, ry));
  grd.addColorStop(0, `rgba(0,0,0,${opacity})`);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.ellipse(cx + dx, cy + dy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

