/**
 * Z-index scale — semantic layering for overlay components.
 * 100-increment gaps leave room for intermediate values.
 *
 * DECISION-08: Scale chosen to support modal stacking,
 * dropdowns over sticky headers, and toast above everything.
 *
 * SINGLE SOURCE OF TRUTH: Imported from @themes/base to avoid duplication
 */
import { coreZIndex } from '@themes/base';

export const zIndex = coreZIndex;

export type ZIndex = keyof typeof zIndex
