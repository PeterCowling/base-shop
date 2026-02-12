'use client'

import { cn } from '../../utils/style/cn'

import type { StaffSignal } from './types'

export interface StaffSignalBadgeGroupProps {
  title?: string
  signals: StaffSignal[]
  className?: string
}

export function StaffSignalBadgeGroup({
  title = 'Readiness signals',
  signals,
  className,
}: StaffSignalBadgeGroupProps) {
  return (
    <section
      aria-label="staff-signal-badges"
      className={cn('rounded-xl bg-muted/40 p-4', className)}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="mt-3">
        {signals.map((signal) => (
          <span
            key={signal.id}
            className={cn('mb-2 me-2 inline-block rounded-full px-3 py-1 text-xs font-medium')}
            style={{
              backgroundColor: signal.ready
                ? 'hsl(var(--hospitality-ready))'
                : 'hsl(var(--hospitality-warning))',
              color: signal.ready
                ? 'hsl(var(--hospitality-ready-fg))'
                : 'hsl(var(--hospitality-warning-fg))',
            }}
          >
            {signal.label}: {signal.ready ? 'Ready' : 'Pending'}
          </span>
        ))}
      </div>
    </section>
  )
}

export default StaffSignalBadgeGroup
