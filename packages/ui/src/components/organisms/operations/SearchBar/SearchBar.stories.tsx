import type { Meta, StoryObj } from '@storybook/react';
import { SearchBar } from './SearchBar';
import { useState } from 'react';

const meta: Meta<typeof SearchBar> = {
  title: 'Organisms/Operations/SearchBar',
  component: SearchBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="context-operations min-h-screen bg-gray-50 p-8 dark:bg-darkBg">
        <div className="w-[600px]">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

// Basic search bar
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return <SearchBar value={value} onChange={setValue} placeholder="Search inventory..." />;
  },
};

// With recent searches
export const WithRecentSearches: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [recentSearches, setRecentSearches] = useState([
      'Product A',
      'Product B - Blue',
      'SKU-12345',
      'Warehouse Stock',
      'Low Stock Items',
    ]);

    const handleSelectRecent = (search: string) => {
      setValue(search);
    };

    const handleClearRecent = () => {
      setRecentSearches([]);
    };

    return (
      <SearchBar
        value={value}
        onChange={setValue}
        placeholder="Search products..."
        recentSearches={recentSearches}
        onSelectRecent={handleSelectRecent}
        onClearRecent={handleClearRecent}
      />
    );
  },
};

// With keyboard shortcut hint
export const WithShortcutHint: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchBar
        value={value}
        onChange={setValue}
        placeholder="Quick search..."
        shortcutHint="⌘K"
      />
    );
  },
};

// Disabled state
export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchBar
        value={value}
        onChange={setValue}
        placeholder="Search is disabled"
        disabled={true}
      />
    );
  },
};

// With autofocus
export const WithAutofocus: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <SearchBar
        value={value}
        onChange={setValue}
        placeholder="Auto-focused search..."
        autoFocus={true}
      />
    );
  },
};

// Interactive example with results
export const InteractiveWithResults: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const [recentSearches, setRecentSearches] = useState([
      'Laptop',
      'Mouse',
      'Keyboard',
      'Monitor',
    ]);

    const products = [
      'Laptop Pro 15"',
      'Laptop Air 13"',
      'Wireless Mouse',
      'Gaming Mouse',
      'Mechanical Keyboard',
      'Wireless Keyboard',
      '27" Monitor',
      '24" Monitor',
    ];

    const filteredProducts = value
      ? products.filter((p) => p.toLowerCase().includes(value.toLowerCase()))
      : [];

    const handleSelectRecent = (search: string) => {
      setValue(search);
    };

    const handleClearRecent = () => {
      setRecentSearches([]);
    };

    return (
      <div className="space-y-4">
        <SearchBar
          value={value}
          onChange={setValue}
          placeholder="Search products..."
          recentSearches={recentSearches}
          onSelectRecent={handleSelectRecent}
          onClearRecent={handleClearRecent}
          shortcutHint="⌘K"
        />

        {/* Search results */}
        {filteredProducts.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-darkSurface dark:bg-darkSurface">
            <p className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
              Results ({filteredProducts.length})
            </p>
            <ul className="space-y-2">
              {filteredProducts.map((product, index) => (
                <li
                  key={index}
                  className="rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-darkAccentGreen dark:hover:bg-darkBg"
                >
                  {product}
                </li>
              ))}
            </ul>
          </div>
        )}

        {value && filteredProducts.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-darkSurface dark:bg-darkSurface">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No results found for "{value}"
            </p>
          </div>
        )}
      </div>
    );
  },
};
