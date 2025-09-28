export function clampToParent(
  parent: HTMLElement | null | undefined,
  left: number,
  top: number,
  width: number,
  height: number
) {
  if (!parent) return { left, top, width, height };
  const pw = parent.offsetWidth;
  const ph = parent.offsetHeight;
  const w = Math.max(1, Math.min(width, pw));
  const h = Math.max(1, Math.min(height, ph));
  const l = Math.max(0, Math.min(left, Math.max(0, pw - w)));
  const t = Math.max(0, Math.min(top, Math.max(0, ph - h)));
  return { left: l, top: t, width: w, height: h };
}

