/**
 * Core letter-spacing scale
 * Universal across all contexts
 *
 * SINGLE SOURCE OF TRUTH: Imported from @themes/base to avoid duplication
 */
import { coreLetterSpacing } from '@themes/base';

export const letterSpacing = coreLetterSpacing;

export type LetterSpacing = keyof typeof letterSpacing
