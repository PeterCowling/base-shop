import type { ImageOrientation } from "./ImageOrientation";

/**
 * Definition of a publish-to location within the shop-front.
 */
export interface PublishLocation {
  /** Unique, stable identifier (e.g. slug or UUID). */
  id: string;

  /** Human-readable name shown to content editors. */
  name: string;

  /** Optional richer description for tooltips or secondary text. */
  description?: string;

  /** Hierarchical path (e.g. "homepage/hero", "product/:id/upsell"). */
  path: string;

  /** Required orientation for images displayed at this location. */
  requiredOrientation: ImageOrientation;
}
