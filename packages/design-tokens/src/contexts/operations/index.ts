/* eslint-disable ds/no-raw-color -- OPS-000: operations token definitions include raw hex values */
import { spacing } from '../../core/spacing'
import { colors } from '../../core/colors'

/**
 * Operations context tokens
 * Optimized for dense, data-heavy interfaces
 * Used in: Reception, inventory, POS systems, dashboards
 */
export const operationsTokens = {
  spacing: {
    'row-gap': spacing[2],        // 8px between rows
    'section-gap': spacing[4],    // 16px between sections
    'card-padding': spacing[3],   // 12px card padding
    'input-padding': spacing[2],  // 8px input padding
    'table-cell-padding': spacing[2], // 8px table cells
    'button-padding-x': spacing[3],   // 12px button horizontal
    'button-padding-y': spacing[2],   // 8px button vertical
  },

  typography: {
    'base-size': '0.875rem',   // 14px - slightly smaller for density
    'heading-size': '1.125rem', // 18px
    'label-size': '0.75rem',   // 12px - compact labels
    'data-size': '0.875rem',   // 14px - same as base
  },

  colors: {
    // Operational status colors
    'status-available': colors.green[600],
    'status-occupied': colors.red[600],
    'status-cleaning': colors.yellow[600],
    'status-maintenance': colors.blue[600],

    // Stock level colors
    'stock-low': colors.red[600],
    'stock-ok': colors.green[600],
    'stock-high': colors.blue[500],

    // Chart colors for data visualization
    'chart-primary': colors.blue[600],
    'chart-secondary': colors.green[600],
    'chart-tertiary': colors.yellow[600],
    'chart-quaternary': colors.purple[600],
  },

  density: 'compact' as const,
} as const

export type OperationsTokens = typeof operationsTokens
