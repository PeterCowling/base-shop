/**
 * Core size scale - max-width utilities
 * Universal across all contexts
 *
 * SINGLE SOURCE OF TRUTH: Imported from @themes/base to avoid duplication
 */
import { coreSizes } from '@themes/base';

export const sizes = coreSizes;

export type Size = keyof typeof sizes
