import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';
import { Package, Upload, Plus, FileText, Users, ShoppingCart } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'Organisms/Operations/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="context-operations min-h-screen bg-gray-50 p-8 dark:bg-darkBg">
        <div className="w-[800px]">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

// Basic empty state
export const Default: Story = {
  args: {
    icon: Package,
    title: 'No inventory items',
    description: 'Get started by adding your first item to the inventory.',
  },
};

// With single action
export const WithSingleAction: Story = {
  args: {
    icon: Package,
    title: 'No inventory items',
    description: 'Get started by adding your first item to the inventory.',
    actions: [
      {
        label: 'Add Item',
        onClick: () => alert('Add item clicked'),
        variant: 'primary',
        icon: Plus,
      },
    ],
  },
};

// With multiple actions
export const WithMultipleActions: Story = {
  args: {
    icon: Package,
    title: 'No inventory items',
    description: 'Get started by adding your first item to the inventory or import from a file.',
    actions: [
      {
        label: 'Add Item',
        onClick: () => alert('Add item clicked'),
        variant: 'primary',
        icon: Plus,
      },
      {
        label: 'Import Items',
        onClick: () => alert('Import clicked'),
        variant: 'secondary',
        icon: Upload,
      },
    ],
  },
};

// No orders
export const NoOrders: Story = {
  args: {
    icon: ShoppingCart,
    title: 'No orders yet',
    description: 'Orders will appear here once customers start making purchases.',
  },
};

// No search results
export const NoSearchResults: Story = {
  args: {
    icon: FileText,
    title: 'No results found',
    description: 'We couldn\'t find any items matching your search. Try adjusting your filters or search terms.',
    actions: [
      {
        label: 'Clear Filters',
        onClick: () => alert('Clear filters clicked'),
        variant: 'primary',
      },
    ],
  },
};

// No team members
export const NoTeamMembers: Story = {
  args: {
    icon: Users,
    title: 'No team members',
    description: 'Invite your team to collaborate and manage operations together.',
    actions: [
      {
        label: 'Invite Team',
        onClick: () => alert('Invite clicked'),
        variant: 'primary',
        icon: Plus,
      },
    ],
  },
};

// Small size
export const SmallSize: Story = {
  args: {
    icon: Package,
    title: 'No items',
    description: 'Add items to get started.',
    size: 'sm',
    actions: [
      {
        label: 'Add',
        onClick: () => alert('Add clicked'),
        variant: 'primary',
        icon: Plus,
      },
    ],
  },
};

// Large size
export const LargeSize: Story = {
  args: {
    icon: Package,
    title: 'Welcome to Inventory Management',
    description: 'Start building your inventory by adding products, tracking stock levels, and managing your warehouse efficiently.',
    size: 'lg',
    actions: [
      {
        label: 'Get Started',
        onClick: () => alert('Get started clicked'),
        variant: 'primary',
        icon: Plus,
      },
      {
        label: 'Learn More',
        onClick: () => alert('Learn more clicked'),
        variant: 'secondary',
      },
    ],
  },
};

// With custom content
export const WithCustomContent: Story = {
  args: {
    icon: Package,
    title: 'No items in this category',
    description: 'This category is currently empty.',
    children: (
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-darkBg dark:bg-darkBg">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          💡 <strong>Tip:</strong> You can import items from a CSV file or add them manually one by one.
        </p>
      </div>
    ),
    actions: [
      {
        label: 'Add Item',
        onClick: () => alert('Add item clicked'),
        variant: 'primary',
        icon: Plus,
      },
      {
        label: 'Import CSV',
        onClick: () => alert('Import clicked'),
        variant: 'secondary',
        icon: Upload,
      },
    ],
  },
};

// No icon
export const NoIcon: Story = {
  args: {
    title: 'Feature Coming Soon',
    description: 'This feature is currently under development and will be available in the next update.',
    actions: [
      {
        label: 'Notify Me',
        onClick: () => alert('Notify clicked'),
        variant: 'primary',
      },
    ],
  },
};
