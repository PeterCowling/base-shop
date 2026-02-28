import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Copy, Edit, Share2,Trash2 } from 'lucide-react';

import { ActionSheet } from './ActionSheet';

const meta: Meta<typeof ActionSheet> = {
  title: 'Organisms/Operations/ActionSheet',
  component: ActionSheet,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="context-operations min-h-screen bg-gray-50 p-8 dark:bg-darkBg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ActionSheet>;

// Basic action sheet
export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-primary-fg hover:bg-primary-700 dark:bg-darkAccentGreen dark:text-darkBg min-h-11 min-w-11"
        >
          Open Action Sheet
        </button>

        <ActionSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Quick Actions"
          description="Choose an action to perform on this item"
        >
          <div className="space-y-2">
            <button
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-start text-muted-foreground hover:bg-gray-50 dark:text-darkAccentGreen dark:hover:bg-darkBg min-h-11 min-w-11"
              onClick={() => {
                alert('Edit clicked');
                setIsOpen(false);
              }}
            >
              <Edit className="h-5 w-5" />
              <div>
                <div className="font-medium">Edit Item</div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">Modify item details</div>
              </div>
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-start text-muted-foreground hover:bg-gray-50 dark:text-darkAccentGreen dark:hover:bg-darkBg min-h-11 min-w-11"
              onClick={() => {
                alert('Copy clicked');
                setIsOpen(false);
              }}
            >
              <Copy className="h-5 w-5" />
              <div>
                <div className="font-medium">Duplicate</div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">Create a copy</div>
              </div>
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-start text-muted-foreground hover:bg-gray-50 dark:text-darkAccentGreen dark:hover:bg-darkBg min-h-11 min-w-11"
              onClick={() => {
                alert('Share clicked');
                setIsOpen(false);
              }}
            >
              <Share2 className="h-5 w-5" />
              <div>
                <div className="font-medium">Share</div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">Share with team</div>
              </div>
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-start text-danger-fg hover:bg-error-light dark:text-red-400 dark:hover:bg-red-900/20 min-h-11 min-w-11"
              onClick={() => {
                alert('Delete clicked');
                setIsOpen(false);
              }}
            >
              <Trash2 className="h-5 w-5" />
              <div>
                <div className="font-medium">Delete</div>
                <div className="text-sm text-danger-fg dark:text-red-400">Permanently remove</div>
              </div>
            </button>
          </div>
        </ActionSheet>
      </>
    );
  },
};

// With form content
export const WithForm: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-primary-fg hover:bg-primary-700 dark:bg-darkAccentGreen dark:text-darkBg min-h-11 min-w-11"
        >
          Add New Item
        </button>

        <ActionSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Add Inventory Item"
          description="Fill in the details for the new item"
        >
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300">
                Item Name
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-border-2 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-primary-500 dark:border-darkBg dark:bg-darkBg dark:text-darkAccentGreen"
                placeholder="Enter item name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300">
                SKU
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-border-2 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-primary-500 dark:border-darkBg dark:bg-darkBg dark:text-darkAccentGreen"
                placeholder="e.g., PROD-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground dark:text-gray-300">
                Quantity
              </label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border border-border-2 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus-visible:focus:ring-1 focus-visible:focus:ring-primary-500 dark:border-darkBg dark:bg-darkBg dark:text-darkAccentGreen"
                placeholder="0"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-border-2 bg-surface px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm hover:bg-gray-50 dark:border-darkBg dark:bg-darkSurface dark:text-darkAccentGreen dark:hover:bg-darkBg min-h-11 min-w-11"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-primary-fg shadow-sm hover:bg-primary-700 dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-green-600 min-h-11 min-w-11"
              >
                Add Item
              </button>
            </div>
          </form>
        </ActionSheet>
      </>
    );
  },
};

// With long content (scrollable)
export const WithLongContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
    }));

    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-primary-fg hover:bg-primary-700 dark:bg-darkAccentGreen dark:text-darkBg min-h-11 min-w-11"
        >
          View All Items
        </button>

        <ActionSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="All Items"
          description="Select an item to view details"
        >
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-start text-muted-foreground hover:bg-gray-50 dark:text-darkAccentGreen dark:hover:bg-darkBg min-h-11 min-w-11"
                onClick={() => {
                  alert(`Selected: ${item.name}`);
                  setIsOpen(false);
                }}
              >
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">{item.description}</div>
                </div>
              </button>
            ))}
          </div>
        </ActionSheet>
      </>
    );
  },
};

// No backdrop close
export const NoBackdropClose: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-primary-fg hover:bg-primary-700 dark:bg-darkAccentGreen dark:text-darkBg min-h-11 min-w-11"
        >
          Open (No Backdrop Close)
        </button>

        <ActionSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Confirm Action"
          description="This action cannot be undone"
          closeOnBackdropClick={false}
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Are you sure you want to proceed? This will permanently delete the item.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-border-2 bg-surface px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm hover:bg-gray-50 dark:border-darkBg dark:bg-darkSurface dark:text-darkAccentGreen dark:hover:bg-darkBg min-h-11 min-w-11"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Confirmed');
                  setIsOpen(false);
                }}
                className="rounded-lg bg-error-main px-4 py-2 text-sm font-semibold text-primary-fg shadow-sm hover:bg-red-700 min-h-11 min-w-11"
              >
                Delete
              </button>
            </div>
          </div>
        </ActionSheet>
      </>
    );
  },
};
