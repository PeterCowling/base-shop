// Utility functions for converting between screen (client) coordinates
// and logical canvas coordinates when the canvas is scaled via CSS transform.

export type Point = { x: number; y: number };
export type Rect = { left: number; top: number; width: number; height: number };

export function screenToCanvas(
  client: Point,
  canvasRect: DOMRect | { left: number; top: number },
  zoom = 1,
): Point {
  const x = (client.x - canvasRect.left) / Math.max(zoom, 0.0001);
  const y = (client.y - canvasRect.top) / Math.max(zoom, 0.0001);
  return { x, y };
}

export function rectScreenToCanvas(
  rect: Rect,
  canvasRect: DOMRect | { left: number; top: number },
  zoom = 1,
): Rect {
  const left = (rect.left - canvasRect.left) / Math.max(zoom, 0.0001);
  const top = (rect.top - canvasRect.top) / Math.max(zoom, 0.0001);
  const width = rect.width / Math.max(zoom, 0.0001);
  const height = rect.height / Math.max(zoom, 0.0001);
  return { left, top, width, height };
}

export function addPoints(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subPoints(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function clampRectToPositive(r: Rect): Rect {
  return {
    left: Math.max(0, r.left),
    top: Math.max(0, r.top),
    width: Math.max(0, r.width),
    height: Math.max(0, r.height),
  };
}

export function normalizeDragDelta(
  start: Point,
  current: Point,
  zoom = 1,
): Point {
  // Convert screen-space delta to canvas-space delta
  return {
    x: (current.x - start.x) / Math.max(zoom, 0.0001),
    y: (current.y - start.y) / Math.max(zoom, 0.0001),
  };
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  const ax2 = a.left + a.width;
  const ay2 = a.top + a.height;
  const bx2 = b.left + b.width;
  const by2 = b.top + b.height;
  return a.left < bx2 && ax2 > b.left && a.top < by2 && ay2 > b.top;
}

