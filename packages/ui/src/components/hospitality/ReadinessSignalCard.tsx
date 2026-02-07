'use client'

import { CheckCircle2 } from 'lucide-react'

import { cn } from '../../utils/style/cn'

export interface ReadinessSignalCardProps {
  score: number
  completedCount: number
  totalCount: number
  readyLabel?: string
  className?: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function ReadinessSignalCard({
  score,
  completedCount,
  totalCount,
  readyLabel = 'You are ready for arrival',
  className,
}: ReadinessSignalCardProps) {
  const safeScore = clamp(score, 0, 100)

  return (
    <div className={cn('rounded-xl bg-card p-6 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Readiness
          </div>
          <div className="mt-1 text-3xl font-bold text-foreground">{safeScore}%</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {completedCount}/{totalCount} items complete
          </div>
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${safeScore}%`,
            backgroundImage: 'linear-gradient(90deg, hsl(var(--hospitality-progress-start)), hsl(var(--hospitality-progress-end)))',
          }}
          data-token="hospitality-progress"
        />
      </div>

      {safeScore >= 80 && (
        <p
          className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: 'hsl(var(--hospitality-ready))',
            color: 'hsl(var(--hospitality-ready-fg))',
          }}
          data-token="hospitality-ready"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          {readyLabel}
        </p>
      )}
    </div>
  )
}

export default ReadinessSignalCard
