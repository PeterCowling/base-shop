import type { Meta, StoryObj } from '@storybook/react'
import { ClipboardList,DollarSign, FileText, Package, Plus, Settings, UserMinus, UserPlus } from 'lucide-react'

import { QuickActionBar } from './QuickActionBar'

const meta: Meta<typeof QuickActionBar> = {
  title: 'Organisms/Operations/QuickActionBar',
  component: QuickActionBar,
  decorators: [
    (Story) => (
      <div className="context-operations p-8 min-h-screen bg-gray-50 dark:bg-darkBg">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof QuickActionBar>

const commonActions = [
  { id: 'new', label: 'New Booking', icon: Plus, onClick: () => alert('New Booking') },
  { id: 'checkin', label: 'Check In', icon: UserPlus, onClick: () => alert('Check In') },
  { id: 'checkout', label: 'Check Out', icon: UserMinus, onClick: () => alert('Check Out') },
  { id: 'reports', label: 'Reports', icon: FileText, onClick: () => alert('Reports') },
]

export const Default: Story = {
  args: {
    actions: commonActions,
  },
}

export const WithBadges: Story = {
  args: {
    actions: [
      { id: 'new', label: 'New Booking', icon: Plus, onClick: () => {}, badge: 3 },
      { id: 'checkin', label: 'Check In', icon: UserPlus, onClick: () => {}, badge: 12 },
      { id: 'checkout', label: 'Check Out', icon: UserMinus, onClick: () => {}, badge: 5 },
      { id: 'reports', label: 'Reports', icon: FileText, onClick: () => {} },
    ],
  },
}

export const SmallSize: Story = {
  args: {
    actions: commonActions,
    size: 'sm',
  },
}

export const LargeSize: Story = {
  args: {
    actions: commonActions,
    size: 'lg',
  },
}

export const VerticalOrientation: Story = {
  args: {
    actions: commonActions,
    orientation: 'vertical',
  },
}

export const WithVariants: Story = {
  args: {
    actions: [
      { id: 'new', label: 'New Order', icon: Plus, onClick: () => {}, variant: 'primary' },
      { id: 'save', label: 'Save Draft', icon: ClipboardList, onClick: () => {}, variant: 'default' },
      { id: 'delete', label: 'Cancel Order', icon: UserMinus, onClick: () => {}, variant: 'danger' },
      { id: 'settings', label: 'Settings', icon: Settings, onClick: () => {} },
    ],
  },
}

export const WithDisabled: Story = {
  args: {
    actions: [
      { id: 'new', label: 'New Booking', icon: Plus, onClick: () => {} },
      { id: 'checkin', label: 'Check In', icon: UserPlus, onClick: () => {}, disabled: true },
      { id: 'checkout', label: 'Check Out', icon: UserMinus, onClick: () => {} },
      { id: 'reports', label: 'Reports', icon: FileText, onClick: () => {} },
    ],
  },
}

export const ReceptionActions: Story = {
  args: {
    actions: [
      { id: 'new', label: 'New Booking', icon: Plus, onClick: () => {}, variant: 'primary' },
      { id: 'checkin', label: 'Check In', icon: UserPlus, onClick: () => {}, badge: 8 },
      { id: 'checkout', label: 'Check Out', icon: UserMinus, onClick: () => {}, badge: 3 },
      { id: 'reports', label: 'Reports', icon: FileText, onClick: () => {} },
      { id: 'settings', label: 'Settings', icon: Settings, onClick: () => {} },
    ],
    size: 'md',
  },
}

export const POSActions: Story = {
  args: {
    actions: [
      { id: 'new-order', label: 'New Order', icon: Plus, onClick: () => {}, variant: 'primary' },
      { id: 'payments', label: 'Payments', icon: DollarSign, onClick: () => {}, badge: 2 },
      { id: 'inventory', label: 'Inventory', icon: Package, onClick: () => {} },
      { id: 'reports', label: 'Reports', icon: FileText, onClick: () => {} },
    ],
    size: 'lg', // Large for touch screens
  },
}

export const VerticalSidebar: Story = {
  args: {
    actions: [
      { id: 'new', label: 'New Booking', icon: Plus, onClick: () => {}, variant: 'primary' },
      { id: 'checkin', label: 'Check In', icon: UserPlus, onClick: () => {}, badge: 8 },
      { id: 'checkout', label: 'Check Out', icon: UserMinus, onClick: () => {}, badge: 3 },
      { id: 'reports', label: 'Reports', icon: FileText, onClick: () => {} },
      { id: 'settings', label: 'Settings', icon: Settings, onClick: () => {} },
    ],
    orientation: 'vertical',
    size: 'md',
  },
}

export const HighBadgeCount: Story = {
  args: {
    actions: [
      { id: 'pending', label: 'Pending', icon: ClipboardList, onClick: () => {}, badge: 127 },
      { id: 'processing', label: 'Processing', icon: Settings, onClick: () => {}, badge: 45 },
      { id: 'completed', label: 'Completed', icon: FileText, onClick: () => {} },
    ],
  },
}
