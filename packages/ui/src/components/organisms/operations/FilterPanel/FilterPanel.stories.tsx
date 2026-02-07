import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { FilterPanel } from './FilterPanel';

const meta: Meta<typeof FilterPanel> = {
  title: 'Operations/FilterPanel',
  component: FilterPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FilterPanel>;

// Sample filter components
function StatusFilter() {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2">
        <input type="checkbox" className="rounded" />
        <span className="text-sm">Active</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" className="rounded" />
        <span className="text-sm">Inactive</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" className="rounded" />
        <span className="text-sm">Pending</span>
      </label>
    </div>
  );
}

function DateRangeFilter() {
  return (
    <div className="space-y-2">
      <div>
        <label className="mb-1 block text-xs text-slate-600">From</label>
        <input type="date" className="w-full rounded border border-slate-200 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-600">To</label>
        <input type="date" className="w-full rounded border border-slate-200 px-2 py-1 text-sm" />
      </div>
    </div>
  );
}

function CategoryFilter() {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2">
        <input type="checkbox" className="rounded" />
        <span className="text-sm">Electronics</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" className="rounded" />
        <span className="text-sm">Clothing</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" className="rounded" />
        <span className="text-sm">Home & Garden</span>
      </label>
    </div>
  );
}

const sampleSections = [
  {
    id: 'status',
    title: 'Status',
    children: <StatusFilter />,
    defaultExpanded: true,
  },
  {
    id: 'date',
    title: 'Date Range',
    children: <DateRangeFilter />,
    defaultExpanded: false,
  },
  {
    id: 'category',
    title: 'Category',
    children: <CategoryFilter />,
    defaultExpanded: false,
  },
];

export const Default: Story = {
  args: {
    sections: sampleSections,
  },
};

export const WithActiveFilters: Story = {
  args: {
    sections: sampleSections,
    activeFiltersCount: 3,
    showClearButton: true,
  },
};

export const WithApplyButton: Story = {
  args: {
    sections: sampleSections,
    showApplyButton: true,
    onApply: () => alert('Filters applied!'),
  },
};

export const Collapsible: Story = {
  args: {
    sections: sampleSections,
    isCollapsible: true,
    activeFiltersCount: 2,
  },
};

export const DefaultCollapsed: Story = {
  args: {
    sections: sampleSections,
    isCollapsible: true,
    defaultCollapsed: true,
    activeFiltersCount: 5,
  },
};

export const AllSectionsExpanded: Story = {
  args: {
    sections: sampleSections.map((section) => ({
      ...section,
      defaultExpanded: true,
    })),
  },
};

export const Interactive: Story = {
  render: () => {
    const [activeCount, setActiveCount] = useState(0);

    return (
      <div className="space-y-4">
        <FilterPanel
          sections={sampleSections}
          activeFiltersCount={activeCount}
          showClearButton
          showApplyButton
          onClear={() => {
            setActiveCount(0);
            alert('Filters cleared!');
          }}
          onApply={() => alert(`Applied ${activeCount} filters`)}
        />

        <div className="rounded border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-sm font-medium">Simulate filters:</p>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveCount((c) => Math.min(c + 1, 10))}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
            >
              Add Filter
            </button>
            <button
              onClick={() => setActiveCount((c) => Math.max(c - 1, 0))}
              className="rounded bg-slate-600 px-3 py-1 text-sm text-white hover:bg-slate-700"
            >
              Remove Filter
            </button>
          </div>
        </div>
      </div>
    );
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-slate-900 p-8">
      <FilterPanel
        sections={sampleSections}
        activeFiltersCount={2}
        showClearButton
        showApplyButton
        onApply={() => {}}
      />
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
