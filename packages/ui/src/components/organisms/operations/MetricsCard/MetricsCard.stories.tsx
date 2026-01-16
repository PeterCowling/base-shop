import type { Meta, StoryObj } from '@storybook/react'
import { DollarSign, Users, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react'
import { MetricsCard } from './MetricsCard'

const meta: Meta<typeof MetricsCard> = {
  title: 'Organisms/Operations/MetricsCard',
  component: MetricsCard,
  decorators: [
    (Story) => (
      <div className="context-operations p-8 min-h-screen bg-gray-50 dark:bg-darkBg">
        <div className="max-w-sm">
          <Story />
        </div>
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof MetricsCard>

export const Default: Story = {
  args: {
    label: 'Total Revenue',
    value: '€1,234.56',
  },
}

export const WithTrendUp: Story = {
  args: {
    label: 'Daily Sales',
    value: '€456.78',
    trend: {
      value: 12.5,
      direction: 'up',
    },
  },
}

export const WithTrendDown: Story = {
  args: {
    label: 'Stock Level',
    value: '23 items',
    trend: {
      value: -8.3,
      direction: 'down',
    },
  },
}

export const WithIcon: Story = {
  args: {
    label: 'Total Revenue',
    value: '€2,845.90',
    icon: DollarSign,
    trend: {
      value: 15.2,
      direction: 'up',
    },
  },
}

export const SuccessVariant: Story = {
  args: {
    label: 'Active Bookings',
    value: '42',
    variant: 'success',
    icon: Users,
    trend: {
      value: 8.7,
      direction: 'up',
    },
    description: 'Currently checked in',
  },
}

export const WarningVariant: Story = {
  args: {
    label: 'Low Stock Items',
    value: '7',
    variant: 'warning',
    icon: AlertTriangle,
    description: 'Require restocking',
  },
}

export const DangerVariant: Story = {
  args: {
    label: 'Failed Transactions',
    value: '3',
    variant: 'danger',
    icon: AlertTriangle,
    trend: {
      value: -50.0,
      direction: 'down',
    },
    description: 'Last 24 hours',
  },
}

export const WithDescription: Story = {
  args: {
    label: 'Pending Orders',
    value: '18',
    icon: ShoppingCart,
    description: 'Awaiting fulfillment',
  },
}

export const Interactive: Story = {
  args: {
    label: "Today's Revenue",
    value: '€987.65',
    icon: DollarSign,
    trend: {
      value: 23.4,
      direction: 'up',
    },
    onClick: () => alert('Metrics card clicked!'),
  },
}

export const LargeNumber: Story = {
  args: {
    label: 'Total Sales',
    value: '€123,456.78',
    icon: TrendingUp,
    variant: 'success',
    trend: {
      value: 45.2,
      direction: 'up',
    },
    description: 'This fiscal year',
  },
}

export const DashboardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricsCard
        label="Total Revenue"
        value="€2,845.90"
        icon={DollarSign}
        variant="success"
        trend={{ value: 15.2, direction: 'up' }}
        description="Today"
      />
      <MetricsCard
        label="Active Bookings"
        value="42"
        icon={Users}
        trend={{ value: 8.7, direction: 'up' }}
        description="Currently checked in"
      />
      <MetricsCard
        label="Pending Orders"
        value="18"
        icon={ShoppingCart}
        description="Awaiting fulfillment"
      />
      <MetricsCard
        label="Low Stock Items"
        value="7"
        icon={AlertTriangle}
        variant="warning"
        description="Require restocking"
      />
      <MetricsCard
        label="Stock Coverage"
        value="85%"
        trend={{ value: -3.5, direction: 'down' }}
        description="Days of inventory"
      />
      <MetricsCard
        label="Occupancy Rate"
        value="92%"
        icon={Users}
        variant="success"
        trend={{ value: 5.3, direction: 'up' }}
        description="vs last week"
      />
    </div>
  ),
  decorators: [
    (Story) => (
      <div className="context-operations p-8 min-h-screen bg-gray-50 dark:bg-darkBg">
        <Story />
      </div>
    ),
  ],
}
