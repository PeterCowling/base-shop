'use client'

import type { ReactNode } from 'react'

import { cn } from '../../utils/style/cn'

export interface ArrivalCodePanelProps {
  title: string
  isLoading: boolean
  code: string | null
  loadingLabel: string
  unavailableLabel: string
  renderCode: (code: string) => ReactNode
  className?: string
}

export function ArrivalCodePanel({
  title,
  isLoading,
  code,
  loadingLabel,
  unavailableLabel,
  renderCode,
  className,
}: ArrivalCodePanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-[linear-gradient(180deg,hsl(var(--hospitality-info))_0%,hsl(var(--hospitality-ready))_100%)] p-6',
        className,
      )}
      data-token="hospitality-arrival-panel"
    >
      <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>

      {isLoading ? (
        <div className="flex flex-col items-center py-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">{loadingLabel}</p>
        </div>
      ) : code ? (
        renderCode(code)
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          <p>{unavailableLabel}</p>
        </div>
      )}
    </div>
  )
}

export default ArrivalCodePanel
