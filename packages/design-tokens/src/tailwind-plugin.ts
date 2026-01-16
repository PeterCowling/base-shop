import plugin from 'tailwindcss/plugin'
import { operationsTokens } from './contexts/operations'
import { consumerTokens } from './contexts/consumer'
import { hospitalityTokens } from './contexts/hospitality'
import { spacing } from './core/spacing'

/**
 * Tailwind plugin that provides context-aware utilities and CSS variables
 *
 * Usage in app:
 * <body className="context-operations">
 *   // All children will use operations tokens
 * </body>
 */
export const contextPlugin = plugin(
  function({ addBase, addUtilities }) {
    // Base: Core spacing tokens always available
    addBase({
      ':root': {
        '--space-0': spacing[0],
        '--space-1': spacing[1],
        '--space-2': spacing[2],
        '--space-3': spacing[3],
        '--space-4': spacing[4],
        '--space-5': spacing[5],
        '--space-6': spacing[6],
        '--space-8': spacing[8],
        '--space-10': spacing[10],
        '--space-12': spacing[12],
        '--space-16': spacing[16],
        '--space-20': spacing[20],
        '--space-24': spacing[24],
      }
    })

    // Context utilities
    addUtilities({
      // Operations context - dense, data-heavy
      '.context-operations': {
        fontSize: operationsTokens.typography['base-size'],

        // Typography
        '--base-size': operationsTokens.typography['base-size'],
        '--heading-size': operationsTokens.typography['heading-size'],
        '--label-size': operationsTokens.typography['label-size'],
        '--data-size': operationsTokens.typography['data-size'],

        // Spacing
        '--row-gap': operationsTokens.spacing['row-gap'],
        '--section-gap': operationsTokens.spacing['section-gap'],
        '--card-padding': operationsTokens.spacing['card-padding'],
        '--input-padding': operationsTokens.spacing['input-padding'],
        '--table-cell-padding': operationsTokens.spacing['table-cell-padding'],
        '--button-padding-x': operationsTokens.spacing['button-padding-x'],
        '--button-padding-y': operationsTokens.spacing['button-padding-y'],

        // Status colors
        '--status-available': operationsTokens.colors['status-available'],
        '--status-occupied': operationsTokens.colors['status-occupied'],
        '--status-cleaning': operationsTokens.colors['status-cleaning'],
        '--status-maintenance': operationsTokens.colors['status-maintenance'],

        // Stock colors
        '--stock-low': operationsTokens.colors['stock-low'],
        '--stock-ok': operationsTokens.colors['stock-ok'],
        '--stock-high': operationsTokens.colors['stock-high'],

        // Chart colors
        '--chart-primary': operationsTokens.colors['chart-primary'],
        '--chart-secondary': operationsTokens.colors['chart-secondary'],
        '--chart-tertiary': operationsTokens.colors['chart-tertiary'],
        '--chart-quaternary': operationsTokens.colors['chart-quaternary'],
      },

      // Consumer context - generous spacing, marketing-focused
      '.context-consumer': {
        fontSize: consumerTokens.typography['base-size'],

        // Typography
        '--base-size': consumerTokens.typography['base-size'],
        '--heading-size': consumerTokens.typography['heading-size'],
        '--label-size': consumerTokens.typography['label-size'],
        '--hero-size': consumerTokens.typography['hero-size'],

        // Spacing
        '--row-gap': consumerTokens.spacing['row-gap'],
        '--section-gap': consumerTokens.spacing['section-gap'],
        '--card-padding': consumerTokens.spacing['card-padding'],
        '--input-padding': consumerTokens.spacing['input-padding'],
        '--button-padding-x': consumerTokens.spacing['button-padding-x'],
        '--button-padding-y': consumerTokens.spacing['button-padding-y'],

        // Brand colors
        '--color-brand-primary': consumerTokens.colors['brand-primary'],
        '--color-brand-secondary': consumerTokens.colors['brand-secondary'],
        '--color-accent': consumerTokens.colors['accent'],

        // E-commerce colors
        '--price-default': consumerTokens.colors['price-default'],
        '--price-sale': consumerTokens.colors['price-sale'],
        '--price-original': consumerTokens.colors['price-original'],

        // Badge colors
        '--badge-new': consumerTokens.colors['badge-new'],
        '--badge-sale': consumerTokens.colors['badge-sale'],
        '--badge-featured': consumerTokens.colors['badge-featured'],
      },

      // Hospitality context - balanced between consumer and operations
      '.context-hospitality': {
        fontSize: hospitalityTokens.typography['base-size'],

        // Typography
        '--base-size': hospitalityTokens.typography['base-size'],
        '--heading-size': hospitalityTokens.typography['heading-size'],
        '--label-size': hospitalityTokens.typography['label-size'],

        // Spacing
        '--row-gap': hospitalityTokens.spacing['row-gap'],
        '--section-gap': hospitalityTokens.spacing['section-gap'],
        '--card-padding': hospitalityTokens.spacing['card-padding'],
        '--input-padding': hospitalityTokens.spacing['input-padding'],
        '--button-padding-x': hospitalityTokens.spacing['button-padding-x'],
        '--button-padding-y': hospitalityTokens.spacing['button-padding-y'],

        // Room status colors
        '--room-available': hospitalityTokens.colors['room-available'],
        '--room-occupied': hospitalityTokens.colors['room-occupied'],
        '--room-cleaning': hospitalityTokens.colors['room-cleaning'],
        '--room-maintenance': hospitalityTokens.colors['room-maintenance'],

        // Guest experience colors
        '--amenity-highlight': hospitalityTokens.colors['amenity-highlight'],
        '--booking-primary': hospitalityTokens.colors['booking-primary'],
        '--booking-secondary': hospitalityTokens.colors['booking-secondary'],
      },

      // Density override utilities
      '.density-compact': {
        '--row-gap': operationsTokens.spacing['row-gap'],
        '--section-gap': operationsTokens.spacing['section-gap'],
        '--card-padding': operationsTokens.spacing['card-padding'],
      },

      '.density-comfortable': {
        '--row-gap': consumerTokens.spacing['row-gap'],
        '--section-gap': consumerTokens.spacing['section-gap'],
        '--card-padding': consumerTokens.spacing['card-padding'],
      },

      '.density-default': {
        '--row-gap': hospitalityTokens.spacing['row-gap'],
        '--section-gap': hospitalityTokens.spacing['section-gap'],
        '--card-padding': hospitalityTokens.spacing['card-padding'],
      },
    })
  }
) as unknown
