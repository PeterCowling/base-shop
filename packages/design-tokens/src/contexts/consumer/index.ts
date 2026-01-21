import { colors } from '../../core/colors'
import { spacing } from '../../core/spacing'

/**
 * Consumer context tokens
 * Optimized for marketing, e-commerce, content-heavy interfaces
 * Used in: Product shops, marketing sites, public-facing pages
 */
export const consumerTokens = {
  spacing: {
    'row-gap': spacing[6],        // 24px between rows - generous spacing
    'section-gap': spacing[12],   // 48px between sections
    'card-padding': spacing[6],   // 24px card padding
    'input-padding': spacing[4],  // 16px input padding
    'button-padding-x': spacing[6],   // 24px button horizontal
    'button-padding-y': spacing[3],   // 12px button vertical
  },

  typography: {
    'base-size': '1rem',      // 16px - standard readable size
    'heading-size': '1.5rem', // 24px
    'label-size': '0.875rem', // 14px
    'hero-size': '3rem',      // 48px - large hero text
  },

  colors: {
    // Brand colors - can be overridden per app
    'brand-primary': colors.blue[600],
    'brand-secondary': colors.blue[500],
    'accent': colors.green[600],

    // E-commerce specific
    'price-default': colors.gray[900],
    'price-sale': colors.red[600],
    'price-original': colors.gray[500],

    // Badge colors
    'badge-new': colors.green[600],
    'badge-sale': colors.red[600],
    'badge-featured': colors.purple[600],
  },

  density: 'comfortable' as const,
} as const

export type ConsumerTokens = typeof consumerTokens
