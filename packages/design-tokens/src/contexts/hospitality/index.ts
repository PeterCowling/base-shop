import { spacing } from '../../core/spacing'
import { colors } from '../../core/colors'

/**
 * Hospitality context tokens
 * Balanced between consumer (guest-facing) and operations (staff-facing)
 * Used in: Hostel/hotel websites, booking systems, guest portals
 */
export const hospitalityTokens = {
  spacing: {
    'row-gap': spacing[4],        // 16px between rows - medium density
    'section-gap': spacing[8],    // 32px between sections
    'card-padding': spacing[4],   // 16px card padding
    'input-padding': spacing[3],  // 12px input padding
    'button-padding-x': spacing[4],
    'button-padding-y': spacing[2],
  },

  typography: {
    'base-size': '0.9375rem',  // 15px - balanced between 14 and 16
    'heading-size': '1.25rem', // 20px
    'label-size': '0.8125rem', // 13px
  },

  colors: {
    // Room status colors (operations side)
    'room-available': colors.green[600],
    'room-occupied': colors.red[600],
    'room-cleaning': colors.yellow[600],
    'room-maintenance': colors.gray[600],

    // Guest experience colors (consumer side)
    'amenity-highlight': colors.blue[600],
    'booking-primary': colors.green[600],
    'booking-secondary': colors.blue[500],
  },

  density: 'default' as const,
} as const

export type HospitalityTokens = typeof hospitalityTokens
