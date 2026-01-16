'use client'

import { useMemo } from 'react'
import { DollarSign, Users, TrendingUp, AlertTriangle } from 'lucide-react'
import { Grid } from '@acme/ui/atoms'
import { MetricsCard } from '@acme/ui/operations'

interface Transaction {
  timestamp?: string
  amount?: number
  method?: string
}

interface DashboardMetricsProps {
  transactions: Transaction[]
  loading?: boolean
}

/**
 * DashboardMetrics - KPI cards for Reception dashboard
 *
 * Displays key performance indicators using the new MetricsCard component:
 * - Today's Revenue with trend
 * - Transaction Count
 * - Average Transaction
 * - Cash vs Card split
 */
export function DashboardMetrics({ transactions, loading }: DashboardMetricsProps) {
  const metrics = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        todayRevenue: 0,
        yesterdayRevenue: 0,
        todayCount: 0,
        avgTransaction: 0,
        cashTotal: 0,
        cardTotal: 0,
      }
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const todayTxns = transactions.filter((txn) =>
      txn.timestamp?.startsWith(today)
    )
    const yesterdayTxns = transactions.filter((txn) =>
      txn.timestamp?.startsWith(yesterday)
    )

    const todayRevenue = todayTxns.reduce((sum, txn) => sum + (txn.amount || 0), 0)
    const yesterdayRevenue = yesterdayTxns.reduce(
      (sum, txn) => sum + (txn.amount || 0),
      0
    )

    const cashTotal = todayTxns
      .filter((txn) => txn.method?.toLowerCase() === 'cash')
      .reduce((sum, txn) => sum + (txn.amount || 0), 0)

    const cardTotal = todayTxns
      .filter((txn) => txn.method?.toLowerCase() === 'card')
      .reduce((sum, txn) => sum + (txn.amount || 0), 0)

    return {
      todayRevenue,
      yesterdayRevenue,
      todayCount: todayTxns.length,
      avgTransaction: todayTxns.length > 0 ? todayRevenue / todayTxns.length : 0,
      cashTotal,
      cardTotal,
    }
  }, [transactions])

  const revenueTrend = useMemo(() => {
    if (metrics.yesterdayRevenue === 0) return null
    const change =
      ((metrics.todayRevenue - metrics.yesterdayRevenue) /
        metrics.yesterdayRevenue) *
      100
    return {
      value: Math.abs(change),
      direction: change >= 0 ? ('up' as const) : ('down' as const),
    }
  }, [metrics])

  const formatEuro = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  if (loading) {
    return (
      <Grid cols={1} gap={4} className="md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 dark:bg-darkSurface animate-pulse rounded-lg"
          />
        ))}
      </Grid>
    )
  }

  return (
    <Grid cols={1} gap={4} className="md:grid-cols-2 lg:grid-cols-4">
      <MetricsCard
        label="Today's Revenue"
        value={formatEuro(metrics.todayRevenue)}
        icon={DollarSign}
        variant={metrics.todayRevenue > 0 ? 'success' : 'default'}
        trend={revenueTrend || undefined}
        description="vs yesterday"
      />

      <MetricsCard
        label="Transactions"
        value={metrics.todayCount.toString()}
        icon={TrendingUp}
        description="Today"
      />

      <MetricsCard
        label="Avg Transaction"
        value={formatEuro(metrics.avgTransaction)}
        icon={Users}
        description="Per transaction"
      />

      <MetricsCard
        label="Cash/Card Split"
        value={`${Math.round((metrics.cashTotal / (metrics.todayRevenue || 1)) * 100)}%`}
        icon={AlertTriangle}
        variant={metrics.cashTotal > metrics.cardTotal ? 'warning' : 'default'}
        description={`€${metrics.cashTotal.toFixed(2)} cash`}
      />
    </Grid>
  )
}

export default DashboardMetrics
