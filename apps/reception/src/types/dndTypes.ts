// src/types/dndTypes.ts

/**
 * Shared type utilities for the reservation grid – kept intentionally lean so
 * that both UI components *and* business‑logic helpers can depend on the
 * *exact* same shapes.
 *
 * Why make `id` optional?
 * -----------------------
 * Many helper functions (e.g. day‑rendering utilities) only need to know the
 * temporal extent of a reservation. Requiring an `id` in those cases forces
 * needless object re‑shaping or type‑casting. By keeping `id` optional we can
 * freely pass lightweight, in‑memory objects *and* fully‑persisted records
 * around using the *same* `Period` interface, eliminating the confusing split
 * between `Period` and `TReservedPeriod` that previously caused type errors.
 */

/** Built‑in lifecycle states used by the core grid. */
export type CoreStatus = "free" | "awaiting" | "confirmed" | "disabled";

/**
 * Minimal description of a time‑boxed reservation period. `id` is optional so
 * that freshly‑created (but not yet persisted) blocks can reuse the interface
 * without generating a placeholder identifier.
 */
export interface Period<TCustomStatus extends string = never> {
  /** Unique identifier (e.g. database primary key). */
  id?: string;
  /** Inclusive start date (ISO‑8601, YYYY‑MM‑DD). */
  start: string;
  /** Exclusive end date (ISO‑8601, YYYY‑MM‑DD). */
  end: string;
  /** Semantic status used for colouring the grid. */
  status?: TCustomStatus | CoreStatus;
}

/**
 * Slim variant that deliberately omits the (optional) `id`. Retained mainly
 * for backwards compatibility with code that explicitly referenced
 * `TReservedPeriod`.
 */
export type TReservedPeriod<TCustomStatus extends string = never> = Omit<
  Period<TCustomStatus>,
  "id"
>;

/* ───────────────────────────── React‑DND helpers ─────────────────────────── */

export const ItemTypes = {
  RESERVATION: "RESERVATION",
} as const;

export interface ReservationDragItem<TCustomStatus extends string = never> {
  /** Discriminant consumed by `react‑dnd`. */
  type: typeof ItemTypes.RESERVATION;
  /** Period being dragged – `id` may be absent for newly‑created blocks. */
  period: Period<TCustomStatus>;
  /** Metadata required to compute the drop target. */
  sourceRoomNumber: number;
  sourceRowId: string | number;
  sourceStartDate: string;
  sourceEndDate: string;
}

export interface ReservationMovePayload<TCustomStatus extends string = never> {
  draggedItem: ReservationDragItem<TCustomStatus>;
  targetRoomNumber: number;
  targetRowId: string | number;
  targetDate: string; // YYYY‑MM‑DD, inclusive
}
