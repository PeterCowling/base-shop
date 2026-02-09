/**
 * Core typography scales
 *
 * SINGLE SOURCE OF TRUTH: Imported from @themes/base to avoid duplication
 */
import { coreFontSizes, coreFontWeights, coreLineHeights } from '@themes/base';

export const fontSizes = coreFontSizes;
export const fontWeights = coreFontWeights;
export const lineHeights = coreLineHeights;

export type FontSize = keyof typeof fontSizes
export type FontWeight = keyof typeof fontWeights
export type LineHeight = keyof typeof lineHeights
