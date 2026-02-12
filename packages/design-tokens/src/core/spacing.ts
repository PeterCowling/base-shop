/**
 * Core spacing scale - 4px grid system
 * Universal across all contexts
 *
 * SINGLE SOURCE OF TRUTH: Imported from @themes/base to avoid duplication
 */
import { coreSpacing } from '@themes/base';

export const spacing = coreSpacing;

export type Spacing = keyof typeof spacing
