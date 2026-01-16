'use client'

import { useRouter } from 'next/navigation'
import {
  Plus,
  UserPlus,
  UserMinus,
  FileText,
  Grid3x3,
  Coffee,
  Lock,
} from 'lucide-react'
import { QuickActionBar } from '@acme/ui/operations'

/**
 * DashboardQuickActions - Quick action toolbar for Reception dashboard
 *
 * Provides one-click access to the most common operations:
 * - New bookings
 * - Check-in
 * - Check-out
 * - Reports
 * - Rooms grid
 * - Bar
 * - Loans
 */
export function DashboardQuickActions() {
  const router = useRouter()

  const actions = [
    {
      id: 'rooms',
      label: 'Rooms',
      icon: Grid3x3,
      onClick: () => router.push('/rooms-grid'),
    },
    {
      id: 'checkin',
      label: 'Check In',
      icon: UserPlus,
      onClick: () => router.push('/checkin'),
      variant: 'primary' as const,
    },
    {
      id: 'checkout',
      label: 'Check Out',
      icon: UserMinus,
      onClick: () => router.push('/checkout'),
    },
    {
      id: 'bar',
      label: 'Bar',
      icon: Coffee,
      onClick: () => router.push('/bar'),
    },
    {
      id: 'loans',
      label: 'Loans',
      icon: Lock,
      onClick: () => router.push('/loan-items'),
    },
    {
      id: 'eod',
      label: 'End of Day',
      icon: FileText,
      onClick: () => router.push('/end-of-day'),
    },
  ]

  return (
    <div className="bg-white dark:bg-darkSurface rounded-lg p-3 shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-darkAccentGreen">
        Quick Actions
      </h2>
      <QuickActionBar actions={actions} size="md" />
    </div>
  )
}

export default DashboardQuickActions
