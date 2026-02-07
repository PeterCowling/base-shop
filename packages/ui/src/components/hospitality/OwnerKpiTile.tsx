'use client'

import type { LucideIcon } from 'lucide-react'

import { MetricsCard } from '../organisms/operations/MetricsCard/MetricsCard'

export interface OwnerKpiTileProps {
  label: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  description?: string
  icon?: LucideIcon
  variant?: 'default' | 'success' | 'warning' | 'danger'
  className?: string
}

export function OwnerKpiTile({
  label,
  value,
  trend,
  description,
  icon,
  variant,
  className,
}: OwnerKpiTileProps) {
  return (
    <MetricsCard
      label={label}
      value={String(value)}
      trend={trend}
      description={description}
      icon={icon}
      variant={variant}
      className={className}
    />
  )
}

export default OwnerKpiTile
