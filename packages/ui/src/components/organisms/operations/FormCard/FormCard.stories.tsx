import type { Meta, StoryObj } from '@storybook/react';
import { FormCard } from './FormCard';
import { useState } from 'react';

const meta: Meta<typeof FormCard> = {
  title: 'Organisms/Operations/FormCard',
  component: FormCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="context-operations min-h-screen bg-gray-50 p-8 dark:bg-darkBg">
        <div className="mx-auto max-w-2xl">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormCard>;

// Basic form card
export const Default: Story = {
  args: {
    title: 'Inventory Adjustment',
    description: 'Adjust stock levels for this item',
    children: (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quantity
          </label>
          <input
            type="number"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-darkBg dark:bg-darkBg dark:text-darkAccentGreen"
            placeholder="Enter quantity"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason
          </label>
          <textarea
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-darkBg dark:bg-darkBg dark:text-darkAccentGreen"
            placeholder="Explain the adjustment"
          />
        </div>
      </div>
    ),
    footer: (
      <>
        <button
          type="button"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-darkBg dark:bg-darkSurface dark:text-darkAccentGreen dark:hover:bg-darkBg"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-green-600"
        >
          Save Changes
        </button>
      </>
    ),
  },
};

// Loading state
export const Loading: Story = {
  args: {
    ...Default.args,
    state: 'loading',
    showLoadingOverlay: true,
  },
};

// Success state
export const Success: Story = {
  args: {
    ...Default.args,
    state: 'success',
    successMessage: 'Inventory adjusted successfully!',
  },
};

// Error state
export const Error: Story = {
  args: {
    ...Default.args,
    state: 'error',
    errorMessage: 'Failed to update inventory. Please check your input and try again.',
  },
};

// Without footer
export const NoFooter: Story = {
  args: {
    title: 'View Details',
    description: 'Item information',
    children: (
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SKU:</span>
          <span className="text-sm text-gray-900 dark:text-darkAccentGreen">PROD-001</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stock:</span>
          <span className="text-sm text-gray-900 dark:text-darkAccentGreen">45 units</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Location:</span>
          <span className="text-sm text-gray-900 dark:text-darkAccentGreen">Warehouse A</span>
        </div>
      </div>
    ),
  },
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [quantity, setQuantity] = useState('');

    const handleSubmit = () => {
      setState('loading');
      setTimeout(() => {
        if (quantity && parseInt(quantity) > 0) {
          setState('success');
          setTimeout(() => setState('idle'), 3000);
        } else {
          setState('error');
        }
      }, 2000);
    };

    return (
      <FormCard
        title="Add Stock"
        description="Increase inventory count"
        state={state}
        successMessage="Stock added successfully!"
        errorMessage="Please enter a valid quantity greater than 0"
        showLoadingOverlay={true}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setState('idle');
                setQuantity('');
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-darkBg dark:bg-darkSurface dark:text-darkAccentGreen dark:hover:bg-darkBg"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={state === 'loading'}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-green-600"
            >
              {state === 'loading' ? 'Saving...' : 'Add Stock'}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Quantity to Add
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-darkBg dark:bg-darkBg dark:text-darkAccentGreen"
            placeholder="Enter quantity"
          />
        </div>
      </FormCard>
    );
  },
};
