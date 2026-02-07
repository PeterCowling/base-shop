/**
 * Z-index scale — semantic layering for overlay components.
 * 100-increment gaps leave room for intermediate values.
 *
 * DECISION-08: Scale chosen to support modal stacking,
 * dropdowns over sticky headers, and toast above everything.
 */
export const zIndex = {
  base: '0',
  dropdown: '100',
  sticky: '200',
  fixed: '300',
  modalBackdrop: '400',
  modal: '500',
  popover: '600',
  tooltip: '700',
  toast: '800',
  max: '9999',
} as const

export type ZIndex = keyof typeof zIndex
