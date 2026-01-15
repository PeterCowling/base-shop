import type { Meta, StoryObj } from '@storybook/react'
import { StatusIndicator } from './StatusIndicator'

const meta: Meta<typeof StatusIndicator> = {
  title: 'Atoms/StatusIndicator',
  component: StatusIndicator,
  decorators: [
    (Story) => (
      <div className="context-operations p-8 bg-white dark:bg-darkSurface">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof StatusIndicator>

export const RoomAvailable: Story = {
  args: {
    status: 'available',
    variant: 'room',
  },
}

export const RoomOccupied: Story = {
  args: {
    status: 'occupied',
    variant: 'room',
  },
}

export const RoomCleaning: Story = {
  args: {
    status: 'cleaning',
    variant: 'room',
  },
}

export const RoomMaintenance: Story = {
  args: {
    status: 'maintenance',
    variant: 'room',
  },
}

export const StockLow: Story = {
  args: {
    status: 'low',
    variant: 'stock',
  },
}

export const StockOk: Story = {
  args: {
    status: 'ok',
    variant: 'stock',
  },
}

export const StockHigh: Story = {
  args: {
    status: 'high',
    variant: 'stock',
  },
}

export const OrderPending: Story = {
  args: {
    status: 'pending',
    variant: 'order',
  },
}

export const OrderProcessing: Story = {
  args: {
    status: 'processing',
    variant: 'order',
  },
}

export const OrderCompleted: Story = {
  args: {
    status: 'completed',
    variant: 'order',
  },
}

export const SmallSize: Story = {
  args: {
    status: 'available',
    variant: 'room',
    size: 'sm',
  },
}

export const LargeSize: Story = {
  args: {
    status: 'occupied',
    variant: 'room',
    size: 'lg',
  },
}

export const DotOnly: Story = {
  args: {
    status: 'available',
    variant: 'room',
    dotOnly: true,
  },
}

export const CustomLabel: Story = {
  args: {
    status: 'available',
    variant: 'room',
    label: 'Ready for Check-in',
  },
}

export const AllRoomStatuses: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <StatusIndicator status="available" variant="room" />
        <StatusIndicator status="occupied" variant="room" />
        <StatusIndicator status="cleaning" variant="room" />
        <StatusIndicator status="maintenance" variant="room" />
      </div>
    </div>
  ),
}

export const AllStockStatuses: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <StatusIndicator status="low" variant="stock" />
        <StatusIndicator status="ok" variant="stock" />
        <StatusIndicator status="high" variant="stock" />
      </div>
    </div>
  ),
}

export const AllOrderStatuses: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <StatusIndicator status="pending" variant="order" />
        <StatusIndicator status="processing" variant="order" />
        <StatusIndicator status="completed" variant="order" />
        <StatusIndicator status="cancelled" variant="order" />
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <StatusIndicator status="available" variant="room" size="sm" />
        <StatusIndicator status="available" variant="room" size="md" />
        <StatusIndicator status="available" variant="room" size="lg" />
      </div>
    </div>
  ),
}

export const DotsOnly: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <StatusIndicator status="available" variant="room" dotOnly />
        <StatusIndicator status="occupied" variant="room" dotOnly />
        <StatusIndicator status="cleaning" variant="room" dotOnly />
        <StatusIndicator status="maintenance" variant="room" dotOnly />
      </div>
    </div>
  ),
}

export const InDataTable: Story = {
  render: () => (
    <table className="min-w-full border border-gray-200">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2 text-left">Room</th>
          <th className="p-2 text-left">Status</th>
          <th className="p-2 text-left">Guest</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="p-2">101</td>
          <td className="p-2">
            <StatusIndicator status="available" variant="room" size="sm" />
          </td>
          <td className="p-2">-</td>
        </tr>
        <tr className="bg-gray-50">
          <td className="p-2">102</td>
          <td className="p-2">
            <StatusIndicator status="occupied" variant="room" size="sm" />
          </td>
          <td className="p-2">John Doe</td>
        </tr>
        <tr>
          <td className="p-2">103</td>
          <td className="p-2">
            <StatusIndicator status="cleaning" variant="room" size="sm" />
          </td>
          <td className="p-2">-</td>
        </tr>
        <tr className="bg-gray-50">
          <td className="p-2">104</td>
          <td className="p-2">
            <StatusIndicator status="maintenance" variant="room" size="sm" />
          </td>
          <td className="p-2">-</td>
        </tr>
      </tbody>
    </table>
  ),
}
