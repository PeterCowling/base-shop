'use client'

import { QuickActionBar } from '../organisms/operations/QuickActionBar/QuickActionBar'

import type { UtilityStripAction } from './types'

export interface UtilityActionStripProps {
  actions: UtilityStripAction[]
  className?: string
}

export function UtilityActionStrip({ actions, className }: UtilityActionStripProps) {
  return (
    <QuickActionBar
      actions={actions.map((action) => ({
        id: action.id,
        label: action.label,
        icon: action.icon,
        onClick: action.onSelect,
        disabled: action.disabled,
        variant: action.variant,
        badge: action.badge,
      }))}
      size="sm"
      className={className}
    />
  )
}

export default UtilityActionStrip
