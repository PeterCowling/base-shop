import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Archive, Download, Mail,Tag, Trash2 } from 'lucide-react';

import { BulkActions } from './BulkActions';

const meta: Meta<typeof BulkActions> = {
  title: 'Operations/BulkActions',
  component: BulkActions,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BulkActions>;

const sampleActions = [
  {
    id: 'export',
    label: 'Export',
    icon: Download,
    onClick: () => alert('Exporting selected items'),
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    onClick: () => alert('Archiving selected items'),
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: Trash2,
    onClick: () => alert('Deleting selected items'),
    variant: 'danger' as const,
  },
];

export const Default: Story = {
  args: {
    selectedCount: 5,
    totalCount: 100,
    actions: sampleActions,
    onClearSelection: () => alert('Selection cleared'),
  },
};

export const SingleItem: Story = {
  args: {
    selectedCount: 1,
    totalCount: 100,
    actions: sampleActions,
    onClearSelection: () => {},
  },
};

export const WithoutTotalCount: Story = {
  args: {
    selectedCount: 12,
    actions: sampleActions,
    onClearSelection: () => {},
  },
};

export const WithoutIcons: Story = {
  args: {
    selectedCount: 3,
    actions: [
      { id: 'export', label: 'Export', onClick: () => {} },
      { id: 'archive', label: 'Archive', onClick: () => {} },
      { id: 'delete', label: 'Delete', onClick: () => {}, variant: 'danger' as const },
    ],
    onClearSelection: () => {},
  },
};

export const ManyActions: Story = {
  args: {
    selectedCount: 7,
    totalCount: 50,
    actions: [
      { id: 'export', label: 'Export', icon: Download, onClick: () => {} },
      { id: 'tag', label: 'Add Tags', icon: Tag, onClick: () => {} },
      { id: 'email', label: 'Send Email', icon: Mail, onClick: () => {} },
      { id: 'archive', label: 'Archive', icon: Archive, onClick: () => {} },
      { id: 'delete', label: 'Delete', icon: Trash2, onClick: () => {}, variant: 'danger' as const },
    ],
    onClearSelection: () => {},
  },
};

export const WithDisabledActions: Story = {
  args: {
    selectedCount: 2,
    actions: [
      { id: 'export', label: 'Export', icon: Download, onClick: () => {}, disabled: false },
      { id: 'archive', label: 'Archive', icon: Archive, onClick: () => {}, disabled: true },
      { id: 'delete', label: 'Delete', icon: Trash2, onClick: () => {}, variant: 'danger' as const, disabled: true },
    ],
    onClearSelection: () => {},
  },
};

export const StickyPosition: Story = {
  render: () => (
    <div className="space-y-4">
      <BulkActions
        selectedCount={5}
        totalCount={100}
        actions={sampleActions}
        onClearSelection={() => {}}
        position="sticky"
      />
      <div className="h-[600px] space-y-2 overflow-auto rounded border border-slate-200 p-4">
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} className="rounded bg-slate-100 p-3 text-sm">
            Item {i + 1}
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-600">Scroll the list above to see sticky behavior</p>
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [selectedItems, setSelectedItems] = useState<number[]>([1, 3, 5]);

    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));

    const toggleItem = (id: number) => {
      setSelectedItems((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    };

    return (
      <div className="space-y-4">
        {selectedItems.length > 0 && (
          <BulkActions
            selectedCount={selectedItems.length}
            totalCount={items.length}
            actions={[
              {
                id: 'export',
                label: 'Export',
                icon: Download,
                onClick: () => alert(`Exporting ${selectedItems.length} items`),
              },
              {
                id: 'delete',
                label: 'Delete',
                icon: Trash2,
                onClick: () => {
                  if (confirm(`Delete ${selectedItems.length} items?`)) {
                    setSelectedItems([]);
                  }
                },
                variant: 'danger',
              },
            ]}
            onClearSelection={() => setSelectedItems([])}
          />
        )}

        <div className="space-y-2 rounded border border-slate-200 p-4">
          {items.map((item) => (
            <label key={item.id} className="flex items-center gap-3 rounded p-2 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => toggleItem(item.id)}
                className="rounded"
              />
              <span className="text-sm">{item.name}</span>
            </label>
          ))}
        </div>
      </div>
    );
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-slate-900 p-8">
      <BulkActions
        selectedCount={5}
        totalCount={100}
        actions={sampleActions}
        onClearSelection={() => {}}
      />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
