/**
 * Core opacity scale - percentage values as decimals
 * Universal across all contexts
 *
 * SINGLE SOURCE OF TRUTH: Imported from @themes/base to avoid duplication
 */
import { coreOpacity } from '@themes/base';

export const opacity = coreOpacity;

export type Opacity = keyof typeof opacity
