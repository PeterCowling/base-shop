# AUDIT-01: Geometry Usage Audit for lib-primitives-enhancement-plan

**Date:** 2026-01-21
**Auditor:** Claude Code (Opus 4.5)
**Status:** Complete

## Executive Summary

This audit documents all geometry-related code across the base-shop codebase to inform the design of a new unified geometry primitives library. The audit identified two primary geometry modules with near-identical implementations in `packages/ui` and `packages/cms-ui`, plus numerous inline geometry calculations scattered throughout the page-builder system.

### Key Findings

1. **Duplication:** `coords.ts` and `geometry.ts` exist in both `packages/ui` and `packages/cms-ui` with identical implementations
2. **Missing primitives:** No Vector or Matrix types currently exist in the codebase
3. **Division by zero protection:** Zoom functions use `Math.max(zoom, 0.0001)` as epsilon guard
4. **No normalization:** Rect uses `{left, top, width, height}` format throughout; no alternative representations

---

## 1. Source Files Identified

### Core Geometry Modules

| File | Package | Purpose |
|------|---------|---------|
| `packages/ui/src/components/cms/page-builder/utils/coords.ts` | @acme/ui | Point/Rect coordinate transforms |
| `packages/ui/src/components/cms/page-builder/state/layout/geometry.ts` | @acme/ui | Alignment and distribution functions |
| `packages/cms-ui/src/page-builder/utils/coords.ts` | @acme/cms-ui | Point/Rect coordinate transforms (duplicate) |
| `packages/cms-ui/src/page-builder/state/layout/geometry.ts` | @acme/cms-ui | Alignment and distribution (duplicate) |

### Test Files

| File | Coverage |
|------|----------|
| `packages/ui/src/components/cms/page-builder/utils/__tests__/coords.test.ts` | coords.ts functions |
| `packages/ui/src/components/cms/page-builder/state/__tests__/geometry.test.ts` | Alignment functions |
| `packages/ui/src/components/cms/page-builder/state/layout/__tests__/geometry.test.ts` | Alignment functions |
| `packages/cms-ui/src/page-builder/utils/__tests__/coords.test.ts` | coords.ts (duplicate) |
| `packages/cms-ui/src/page-builder/state/__tests__/geometry.test.ts` | geometry.ts (duplicate) |
| `packages/cms-ui/src/page-builder/state/layout/__tests__/geometry.test.ts` | geometry.ts (duplicate) |

### Consumers (files importing or using geometry functions)

| File | Usage |
|------|-------|
| `packages/ui/src/components/cms/page-builder/hooks/usePageBuilderDnD.ts` | `screenToCanvas`, `Point` type |
| `packages/ui/src/components/cms/page-builder/hooks/useSelectionPositions.ts` | `Rect` type |
| `packages/ui/src/components/cms/page-builder/hooks/useDropHighlight.ts` | `rectScreenToCanvas`, `Rect` type |
| `packages/ui/src/components/cms/page-builder/useMarqueeSelect.ts` | `screenToCanvas`, `rectScreenToCanvas`, `rectsIntersect` |
| `packages/ui/src/components/cms/page-builder/useCanvasRotate.ts` | Inline angle/rotation calculations |
| `packages/ui/src/components/cms/page-builder/comments/useDragPins.ts` | Inline coordinate calculations |
| `packages/ui/src/components/cms/page-builder/comments/usePositions.ts` | Inline rect calculations |
| `packages/ui/src/components/cms/page-builder/comments/useAltClickCreate.ts` | Inline position normalization |
| `packages/ui/src/components/cms/page-builder/hooks/dnd/autoscroll.ts` | Inline distance calculations |
| `packages/ui/src/components/cms/page-builder/scrollEffects.ts` | Inline parallax calculations |
| `packages/ui/src/components/cms/page-builder/timeline.ts` | Inline transform/interpolation |

---

## 2. Type Definitions

### Point

**Location:** `packages/ui/src/components/cms/page-builder/utils/coords.ts`

```typescript
export type Point = { x: number; y: number };
```

**Notes:**
- Simple object type, not a class
- Used throughout page-builder for mouse/pointer positions
- No validation of numeric values

### Rect

**Location:** `packages/ui/src/components/cms/page-builder/utils/coords.ts`

```typescript
export type Rect = { left: number; top: number; width: number; height: number };
```

**Notes:**
- Uses `left/top` origin (not `x/y`)
- Matches browser's `getBoundingClientRect()` subset
- Width/height can be negative in some edge cases (e.g., marquee selection building)

### PosSize (Internal)

**Location:** `packages/ui/src/components/cms/page-builder/state/layout/geometry.ts`

```typescript
type PosSize = {
  id: string;
  left: number | null;
  top: number | null;
  width: number | null;
  height: number | null
};
```

**Notes:**
- Internal type for alignment functions
- Nullable values for components without explicit positioning
- Includes `id` for component correlation

### Viewport

**Location:** `packages/ui/src/components/cms/page-builder/state/layout/geometry.ts`

```typescript
type Viewport = "desktop" | "tablet" | "mobile";
```

**Notes:**
- Used for viewport-specific positioning
- Alignment functions accept optional viewport parameter

---

## 3. Function Signatures and Behaviors

### coords.ts Functions

#### `screenToCanvas`

```typescript
export function screenToCanvas(
  client: Point,
  canvasRect: DOMRect | { left: number; top: number },
  zoom = 1,
): Point
```

**Purpose:** Converts screen (client) coordinates to logical canvas coordinates accounting for canvas offset and zoom level.

**Implementation:**
```typescript
const x = (client.x - canvasRect.left) / Math.max(zoom, 0.0001);
const y = (client.y - canvasRect.top) / Math.max(zoom, 0.0001);
return { x, y };
```

**Edge Cases:**
- Zero/negative zoom: Clamped to `0.0001` epsilon to prevent division by zero
- Result always finite due to epsilon guard

**Test Coverage:**
```typescript
test("screenToCanvas respects zoom and canvas origin", () => {
  const p = screenToCanvas({ x: 110, y: 210 }, { left: 10, top: 10 }, 2);
  expect(p).toEqual({ x: 50, y: 100 });
  // zero/negative zoom clamps to epsilon
  const p2 = screenToCanvas({ x: 10, y: 10 }, { left: 0, top: 0 }, 0);
  expect(Number.isFinite(p2.x)).toBe(true);
});
```

---

#### `rectScreenToCanvas`

```typescript
export function rectScreenToCanvas(
  rect: Rect,
  canvasRect: DOMRect | { left: number; top: number },
  zoom = 1,
): Rect
```

**Purpose:** Converts a screen-space rectangle to canvas-space coordinates.

**Implementation:**
```typescript
const left = (rect.left - canvasRect.left) / Math.max(zoom, 0.0001);
const top = (rect.top - canvasRect.top) / Math.max(zoom, 0.0001);
const width = rect.width / Math.max(zoom, 0.0001);
const height = rect.height / Math.max(zoom, 0.0001);
return { left, top, width, height };
```

**Edge Cases:**
- Same epsilon guard as `screenToCanvas`
- Dimensions scaled independently of position

---

#### `addPoints`

```typescript
export function addPoints(a: Point, b: Point): Point
```

**Purpose:** Vector addition of two points.

**Implementation:**
```typescript
return { x: a.x + b.x, y: a.y + b.y };
```

**Edge Cases:**
- No overflow checking
- No NaN handling

---

#### `subPoints`

```typescript
export function subPoints(a: Point, b: Point): Point
```

**Purpose:** Vector subtraction (a - b).

**Implementation:**
```typescript
return { x: a.x - b.x, y: a.y - b.y };
```

---

#### `clampRectToPositive`

```typescript
export function clampRectToPositive(r: Rect): Rect
```

**Purpose:** Clamps all rect values to >= 0.

**Implementation:**
```typescript
return {
  left: Math.max(0, r.left),
  top: Math.max(0, r.top),
  width: Math.max(0, r.width),
  height: Math.max(0, r.height),
};
```

**Test Coverage:**
```typescript
test("clampRectToPositive clamps negative values", () => {
  const clamped = clampRectToPositive({ left: -1, top: -2, width: -3, height: 4 });
  expect(clamped).toEqual({ left: 0, top: 0, width: 0, height: 4 });
});
```

---

#### `normalizeDragDelta`

```typescript
export function normalizeDragDelta(
  start: Point,
  current: Point,
  zoom = 1,
): Point
```

**Purpose:** Converts screen-space drag delta to canvas-space delta.

**Implementation:**
```typescript
return {
  x: (current.x - start.x) / Math.max(zoom, 0.0001),
  y: (current.y - start.y) / Math.max(zoom, 0.0001),
};
```

**Notes:** Combines subtraction and zoom division in one operation.

---

#### `rectsIntersect`

```typescript
export function rectsIntersect(a: Rect, b: Rect): boolean
```

**Purpose:** Tests if two rectangles overlap.

**Implementation:**
```typescript
const ax2 = a.left + a.width;
const ay2 = a.top + a.height;
const bx2 = b.left + b.width;
const by2 = b.top + b.height;
return a.left < bx2 && ax2 > b.left && a.top < by2 && ay2 > b.top;
```

**Edge Cases:**
- Touching edges (shared boundary) returns `false` (strict inequality)
- Assumes positive width/height for correct behavior

**Test Coverage:**
```typescript
test("rectsIntersect detects overlap and non-overlap", () => {
  const a = { left: 0, top: 0, width: 10, height: 10 };
  const b = { left: 5, top: 5, width: 10, height: 10 };
  const c = { left: 20, top: 20, width: 5, height: 5 };
  expect(rectsIntersect(a, b)).toBe(true);
  expect(rectsIntersect(a, c)).toBe(false);
});
```

---

### geometry.ts Functions (Alignment & Distribution)

#### Helper Functions

```typescript
function parsePx(v?: string): number | null
```
Parses pixel strings like `"100px"` to numbers. Returns `null` for non-numeric values.

```typescript
function collect(components: PageComponent[], viewport?: Viewport): Record<string, PosSize>
```
Walks component tree and collects position/size data, respecting viewport-specific overrides.

```typescript
function bounds(items: PosSize[]): { minX: number; minY: number; maxX: number; maxY: number }
```
Computes bounding box of multiple positioned items.

---

#### `alignLeft`

```typescript
export function alignLeft(
  components: PageComponent[],
  ids: string[],
  viewport?: Viewport
): { id: string; left: string }[]
```

**Purpose:** Aligns selected components to leftmost edge.

**Returns:** Patch array with `{ id, left: "Npx" }` for each component.

---

#### `alignTop`

```typescript
export function alignTop(
  components: PageComponent[],
  ids: string[],
  viewport?: Viewport
): { id: string; top: string }[]
```

**Purpose:** Aligns selected components to topmost edge.

---

#### `alignRight`

```typescript
export function alignRight(
  components: PageComponent[],
  ids: string[],
  viewport?: Viewport
): { id: string; left: string }[]
```

**Purpose:** Aligns right edges to rightmost boundary.

**Edge Case:** Filters out items without valid width.

---

#### `alignBottom`

```typescript
export function alignBottom(
  components: PageComponent[],
  ids: string[],
  viewport?: Viewport
): { id: string; top: string }[]
```

**Purpose:** Aligns bottom edges to bottommost boundary.

**Edge Case:** Filters out items without valid height.

---

#### `alignCenterX`

```typescript
export function alignCenterX(
  components: PageComponent[],
  ids: string[],
  viewport?: Viewport
): { id: string; left: string }[]
```

**Purpose:** Centers components horizontally within selection bounds.

**Implementation:** `left = centerX - (width / 2)`

---

#### `alignCenterY`

```typescript
export function alignCenterY(
  components: PageComponent[],
  ids: string[],
  viewport?: Viewport
): { id: string; top: string }[]
```

**Purpose:** Centers components vertically within selection bounds.

---

#### `distributeHorizontal`

```typescript
export function distributeHorizontal(
  components: PageComponent[],
  ids: string[],
  viewport?: Viewport
): { id: string; left: string }[]
```

**Purpose:** Evenly distributes components horizontally.

**Edge Cases:**
- Returns empty array for < 3 items
- Gap can be negative if total width exceeds bounds (overlapping distribution)

**Algorithm:**
```typescript
const gap = (maxX - minX - totalWidth) / (sorted.length - 1);
```

---

#### `distributeVertical`

```typescript
export function distributeVertical(
  components: PageComponent[],
  ids: string[],
  viewport?: Viewport
): { id: string; top: string }[]
```

**Purpose:** Evenly distributes components vertically.

**Edge Cases:** Same as `distributeHorizontal`.

---

## 4. Inline Geometry Patterns Found

### Rotation Calculations (`useCanvasRotate.ts`)

```typescript
const dx = (e.clientX - cx) / Math.max(zoom, 0.0001);
const dy = (e.clientY - cy) / Math.max(zoom, 0.0001);
const a = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180
```

**Pattern:** Angle calculation from center point with zoom compensation.

**Snapping:**
```typescript
const snapped = snap ? Math.round(next / 15) * 15 : next;
```

---

### Distance-Based Autoscroll (`autoscroll.ts`)

```typescript
function speedForDistance(d: number, edge: number, maxSpeed: number): number {
  const within = Math.max(0, edge - d);
  return within > 0 ? Math.ceil((within / edge) * maxSpeed) : 0;
}
```

**Pattern:** Linear interpolation of scroll speed based on distance from edge.

---

### Normalized Position (`useAltClickCreate.ts`, `useDragPins.ts`)

```typescript
const x = (e.clientX - rect.left) / Math.max(1, rect.width);
const y = (e.clientY - rect.top) / Math.max(1, rect.height);
```

**Pattern:** Converting absolute position to 0-1 normalized coordinates within element bounds.

---

### Parallax Transform (`scrollEffects.ts`)

```typescript
const dist = p.baseY - viewportTop - viewportHeight / 2;
const translate = -dist * p.factor * 0.1;
```

**Pattern:** Scroll-driven vertical offset calculation.

---

### Timeline Interpolation (`timeline.ts`)

```typescript
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
```

**Pattern:** Linear interpolation for animation keyframes. Applied to `opacity`, `x`, `y`, `scale`, `rotate`.

---

## 5. Edge Case Behaviors Observed

### Division by Zero Protection

All zoom-related calculations use consistent epsilon guard:
```typescript
Math.max(zoom, 0.0001)
// or for element dimensions:
Math.max(1, rect.width)
```

**Recommendation:** Standardize epsilon value as a constant.

### Null/Missing Value Handling

Alignment functions handle nullable position values:
```typescript
left: parsePx(leftStr),  // Returns null for invalid strings
// Later:
const items = ids.map((id) => map[id]).filter(Boolean);
```

### Negative Gap Distribution

When items are wider than the bounding box, gap becomes negative:
```typescript
const gap = (maxX - minX - totalWidth) / (sorted.length - 1);
// Can be negative, causing overlapping positions
```

**Test documents this behavior:**
```typescript
// gap=(100-0-190)/2 = -45 (overlap -> still consistent math)
```

### Strict Intersection Test

`rectsIntersect` uses strict inequalities:
```typescript
return a.left < bx2 && ax2 > b.left && a.top < by2 && ay2 > b.top;
```

Rects sharing only an edge (touching but not overlapping) return `false`.

---

## 6. Patterns for New API Design

### Observed Conventions

1. **Immutable operations** - All functions return new objects rather than mutating inputs
2. **Object types over classes** - Simple `{ x, y }` / `{ left, top, width, height }` preferred
3. **Optional parameters with defaults** - `zoom = 1`, `viewport?: Viewport`
4. **Patch-based updates** - Alignment functions return partial objects for merging

### Missing Functionality

The following operations are performed inline and could benefit from library functions:

1. **Angle operations:**
   - `atan2` -> degrees conversion
   - Angle normalization to -180..180 or 0..360
   - Snap to degree increment

2. **Interpolation:**
   - Linear interpolation (lerp)
   - Clamped lerp (0-1 range)

3. **Normalization:**
   - Point within rect -> 0-1 coordinates
   - 0-1 coordinates -> point within rect

4. **Distance calculations:**
   - Point to point distance
   - Point to rect edge distances

5. **Transform operations:**
   - No Matrix type exists
   - CSS transform string parsing/generation done inline

### Recommended Type Extensions

```typescript
// Vector operations (currently using Point)
type Vector2D = { x: number; y: number };

// Rect with both representations
type Rect = {
  x: number; y: number;      // origin
  width: number; height: number;
  // OR
  left: number; top: number;  // browser-style
  right: number; bottom: number;
};

// Transform matrix (2D affine)
type Matrix2D = {
  a: number; b: number;
  c: number; d: number;
  tx: number; ty: number;
};
```

---

## 7. Deduplication Opportunity

The `coords.ts` and `geometry.ts` files in `packages/cms-ui` are exact duplicates of those in `packages/ui`. A unified geometry library would:

1. Eliminate 4 duplicate source files
2. Eliminate 4 duplicate test files
3. Provide single source of truth for geometry operations

---

## 8. Summary Table

| Function | File | Usage Count | Test Coverage |
|----------|------|-------------|---------------|
| `screenToCanvas` | coords.ts | 3+ files | Yes |
| `rectScreenToCanvas` | coords.ts | 2+ files | Yes |
| `addPoints` | coords.ts | 1 file | Yes |
| `subPoints` | coords.ts | 1 file | Yes |
| `clampRectToPositive` | coords.ts | 1 file | Yes |
| `normalizeDragDelta` | coords.ts | 1 file | Yes |
| `rectsIntersect` | coords.ts | 2+ files | Yes |
| `alignLeft` | geometry.ts | Unknown | Yes |
| `alignTop` | geometry.ts | Unknown | Yes |
| `alignRight` | geometry.ts | Unknown | Yes |
| `alignBottom` | geometry.ts | Unknown | Yes |
| `alignCenterX` | geometry.ts | Unknown | Yes |
| `alignCenterY` | geometry.ts | Unknown | Yes |
| `distributeHorizontal` | geometry.ts | Unknown | Yes |
| `distributeVertical` | geometry.ts | Unknown | Yes |

---

## 9. Recommendations

1. **Create `@acme/geometry` package** with consolidated primitives
2. **Define constants** for epsilon values (`ZOOM_EPSILON = 0.0001`)
3. **Add Vector type** distinct from Point for semantic clarity
4. **Add Matrix2D type** for transform composition
5. **Add interpolation utilities** (lerp, clamp, ease functions)
6. **Add angle utilities** (radToDeg, degToRad, normalizeAngle, snapAngle)
7. **Add normalized coordinate utilities** (pointToNormalized, normalizedToPoint)
8. **Consider builder pattern** for complex transforms

---

*End of Audit Report*
