import { type LucideIcon } from 'lucide-react'

export interface UtilityStripAction {
  id: string
  label: string
  icon: LucideIcon
  onSelect: () => void
  disabled?: boolean
  variant?: 'default' | 'primary' | 'danger'
  badge?: number
}

export interface StaffSignal {
  id: string
  label: string
  ready: boolean
}
