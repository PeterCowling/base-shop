import type { Meta, StoryObj } from '@storybook/react';
import { Package, Truck, CheckCircle, XCircle, Clock, User, DollarSign, MessageSquare } from 'lucide-react';
import { Timeline } from './Timeline';

const meta: Meta<typeof Timeline> = {
  title: 'Operations/Timeline',
  component: Timeline,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Timeline>;

const sampleEvents = [
  {
    id: '1',
    timestamp: new Date('2024-01-15T09:00:00'),
    title: 'Order created',
    description: 'New order #1234 placed by customer',
    icon: Package,
    iconColor: 'blue' as const,
    user: 'John Doe',
  },
  {
    id: '2',
    timestamp: new Date('2024-01-15T09:30:00'),
    title: 'Payment confirmed',
    description: 'Payment of $150.00 received',
    icon: DollarSign,
    iconColor: 'green' as const,
    user: 'Payment System',
  },
  {
    id: '3',
    timestamp: new Date('2024-01-15T10:00:00'),
    title: 'Order processing',
    description: 'Order sent to warehouse for fulfillment',
    icon: Clock,
    iconColor: 'yellow' as const,
    user: 'Warehouse Manager',
  },
  {
    id: '4',
    timestamp: new Date('2024-01-15T14:30:00'),
    title: 'Order shipped',
    description: 'Package shipped via FedEx. Tracking: 1234567890',
    icon: Truck,
    iconColor: 'blue' as const,
    user: 'Shipping Department',
  },
  {
    id: '5',
    timestamp: new Date('2024-01-16T11:00:00'),
    title: 'Delivered',
    description: 'Package successfully delivered',
    icon: CheckCircle,
    iconColor: 'green' as const,
    user: 'FedEx',
  },
];

export const Default: Story = {
  args: {
    events: sampleEvents,
  },
};

export const WithDate: Story = {
  args: {
    events: sampleEvents,
    showDate: true,
  },
};

export const WithoutTime: Story = {
  args: {
    events: sampleEvents,
    showTime: false,
    showDate: true,
  },
};

export const WithDateAndTime: Story = {
  args: {
    events: sampleEvents,
    showDate: true,
    showTime: true,
  },
};

export const SimpleEvents: Story = {
  args: {
    events: [
      {
        id: '1',
        timestamp: new Date('2024-01-15T10:00:00'),
        title: 'User registered',
        icon: User,
        iconColor: 'blue' as const,
      },
      {
        id: '2',
        timestamp: new Date('2024-01-15T10:30:00'),
        title: 'Profile updated',
        icon: User,
        iconColor: 'green' as const,
      },
      {
        id: '3',
        timestamp: new Date('2024-01-15T11:00:00'),
        title: 'Comment posted',
        icon: MessageSquare,
        iconColor: 'blue' as const,
      },
    ],
  },
};

export const WithMetadata: Story = {
  args: {
    events: [
      {
        id: '1',
        timestamp: new Date('2024-01-15T10:00:00'),
        title: 'Order shipped',
        description: 'Package is on its way',
        icon: Truck,
        iconColor: 'blue' as const,
        metadata: (
          <div className="mt-2 rounded border border-blue-200 bg-blue-50 p-2 text-xs dark:border-blue-900 dark:bg-blue-950">
            <p className="font-medium">Tracking Information</p>
            <p className="text-slate-600 dark:text-slate-400">Carrier: FedEx</p>
            <p className="text-slate-600 dark:text-slate-400">Tracking: 1234567890</p>
          </div>
        ),
      },
      {
        id: '2',
        timestamp: new Date('2024-01-16T15:00:00'),
        title: 'Delivered',
        icon: CheckCircle,
        iconColor: 'green' as const,
      },
    ],
  },
};

export const ErrorEvent: Story = {
  args: {
    events: [
      {
        id: '1',
        timestamp: new Date('2024-01-15T10:00:00'),
        title: 'Order created',
        icon: Package,
        iconColor: 'blue' as const,
      },
      {
        id: '2',
        timestamp: new Date('2024-01-15T10:30:00'),
        title: 'Payment failed',
        description: 'Credit card declined',
        icon: XCircle,
        iconColor: 'red' as const,
        user: 'Payment Gateway',
      },
    ],
  },
};

export const ManyEvents: Story = {
  args: {
    events: Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      timestamp: new Date(Date.now() - i * 3600000),
      title: `Event ${i + 1}`,
      description: `Description for event ${i + 1}`,
      icon: i % 2 === 0 ? Package : CheckCircle,
      iconColor: (['blue', 'green', 'yellow', 'red'] as const)[i % 4],
      user: i % 3 === 0 ? 'System' : 'User',
    })),
    showDate: true,
  },
};

export const Empty: Story = {
  args: {
    events: [],
  },
};

export const EmptyWithCustomMessage: Story = {
  args: {
    events: [],
    emptyMessage: 'No activity recorded for this order',
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-slate-900 p-8">
      <Timeline events={sampleEvents} showDate showTime />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
