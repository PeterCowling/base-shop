// /src/types/messenger/activity.ts
/**
 * Message‑layer activity definitions.
 * Centralised here to avoid circular imports and 'any' leaks.
 */
export interface ActivityTemplate {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt?: number;
  meetUpPoint?: string;
  /** Default meet up time in HH:mm format */
  meetUpTime?: string;
  /** Ticket price; numeric (interpreted as EUR) or formatted string ("Free", "15€" …). */
  price?: number | string;
}

export interface ActivityInstance {
  id: string;
  templateId: string;
  /** Display title shown to guests */
  title: string;
  description?: string;
  meetUpPoint?: string;
  /** Displayed meet up time in HH:mm format */
  meetUpTime?: string;
  imageUrl?: string;
  /** Epoch (ms) start time */
  startTime: number;
  /**
   * Duration of this activity instance in minutes.
   * Optional — when absent, the guest app defaults to 120 minutes.
   * Set via Firebase console when creating new instances.
   * Values ≤ 0 are guarded at the call site with Math.max(1, durationMinutes ?? 120).
   */
  durationMinutes?: number;
  /** Ticket price; numeric (interpreted as EUR) or formatted string ("Free", "15€" …). */
  price?: number | string;
  /** Initial messages shown when the activity goes live */
  initialMessages?: string[];
  /** Link to booking flow or deep‑linked chat */
  rsvpUrl?: string;
  status: 'live' | 'upcoming' | 'archived';
  createdBy: string;
  updatedAt?: number;
}
