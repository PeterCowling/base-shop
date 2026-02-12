/**
 * Core container widths - responsive container max-widths
 * Universal across all contexts
 *
 * SINGLE SOURCE OF TRUTH: Imported from @themes/base to avoid duplication
 */
import { coreContainers } from '@themes/base';

export const containers = coreContainers;

export type Container = keyof typeof containers
