import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Users, Building, Globe, Mail, Phone } from 'lucide-react';
import { ComboBox, type ComboBoxOption } from './ComboBox';

const meta: Meta<typeof ComboBox> = {
  title: 'Organisms/Operations/ComboBox',
  component: ComboBox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ComboBox>;

// Sample data
const countries: ComboBoxOption[] = [
  { value: 'us', label: 'United States', description: 'North America' },
  { value: 'uk', label: 'United Kingdom', description: 'Europe' },
  { value: 'de', label: 'Germany', description: 'Europe' },
  { value: 'fr', label: 'France', description: 'Europe' },
  { value: 'jp', label: 'Japan', description: 'Asia' },
  { value: 'au', label: 'Australia', description: 'Oceania' },
  { value: 'ca', label: 'Canada', description: 'North America' },
  { value: 'br', label: 'Brazil', description: 'South America' },
];

const roles: ComboBoxOption[] = [
  { value: 'admin', label: 'Administrator', group: 'Management', icon: Users },
  { value: 'manager', label: 'Manager', group: 'Management', icon: Building },
  { value: 'developer', label: 'Developer', group: 'Technical', icon: Globe },
  { value: 'designer', label: 'Designer', group: 'Technical', icon: Globe },
  { value: 'support', label: 'Support', group: 'Operations', icon: Mail },
  { value: 'sales', label: 'Sales', group: 'Operations', icon: Phone },
];

// Basic single select
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <ComboBox
        options={countries}
        value={value}
        onChange={setValue}
        placeholder="Select a country..."
      />
    );
  },
};

// With pre-selected value
export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>('uk');
    return (
      <ComboBox
        options={countries}
        value={value}
        onChange={setValue}
        placeholder="Select a country..."
      />
    );
  },
};

// Multiple selection
export const MultipleSelect: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <ComboBox
        options={countries}
        value={value}
        onChange={(v) => setValue(v as string[])}
        placeholder="Select countries..."
        multiple
      />
    );
  },
};

// With groups
export const Grouped: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <ComboBox
        options={roles}
        value={value}
        onChange={(v) => setValue(v as string[])}
        placeholder="Select roles..."
        multiple
        grouped
      />
    );
  },
};

// With max selections
export const MaxSelections: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <ComboBox
        options={countries}
        value={value}
        onChange={(v) => setValue(v as string[])}
        placeholder="Select up to 3 countries..."
        multiple
        maxSelections={3}
      />
    );
  },
};

// Size variants
export const Sizes: Story = {
  render: () => {
    const [sm, setSm] = useState<string | null>(null);
    const [md, setMd] = useState<string | null>(null);
    const [lg, setLg] = useState<string | null>(null);
    return (
      <div className="flex flex-col gap-4 w-80">
        <ComboBox
          options={countries}
          value={sm}
          onChange={setSm}
          placeholder="Small"
          size="sm"
        />
        <ComboBox
          options={countries}
          value={md}
          onChange={setMd}
          placeholder="Medium (default)"
          size="md"
        />
        <ComboBox
          options={countries}
          value={lg}
          onChange={setLg}
          placeholder="Large"
          size="lg"
        />
      </div>
    );
  },
};

// Disabled state
export const Disabled: Story = {
  render: () => (
    <ComboBox
      options={countries}
      value="uk"
      onChange={() => {}}
      placeholder="Select a country..."
      disabled
    />
  ),
};

// Loading state
export const Loading: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <ComboBox
        options={countries}
        value={value}
        onChange={setValue}
        placeholder="Loading options..."
        loading
      />
    );
  },
};

// With error
export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <ComboBox
        options={countries}
        value={value}
        onChange={setValue}
        placeholder="Select a country..."
        error="Please select a country"
      />
    );
  },
};

// Non-searchable
export const NonSearchable: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <ComboBox
        options={countries}
        value={value}
        onChange={setValue}
        placeholder="Select a country..."
        searchable={false}
      />
    );
  },
};

// Non-clearable
export const NonClearable: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>('us');
    return (
      <ComboBox
        options={countries}
        value={value}
        onChange={setValue}
        placeholder="Select a country..."
        clearable={false}
      />
    );
  },
};

// With disabled options
export const WithDisabledOptions: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    const optionsWithDisabled: ComboBoxOption[] = [
      ...countries.slice(0, 3),
      { ...countries[3], disabled: true },
      ...countries.slice(4),
    ];
    return (
      <ComboBox
        options={optionsWithDisabled}
        value={value}
        onChange={setValue}
        placeholder="Select a country..."
      />
    );
  },
};

// Custom option renderer
export const CustomRenderer: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <ComboBox
        options={countries}
        value={value}
        onChange={setValue}
        placeholder="Select a country..."
        renderOption={(option, selected) => (
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {option.value === 'us' && '🇺🇸'}
              {option.value === 'uk' && '🇬🇧'}
              {option.value === 'de' && '🇩🇪'}
              {option.value === 'fr' && '🇫🇷'}
              {option.value === 'jp' && '🇯🇵'}
              {option.value === 'au' && '🇦🇺'}
              {option.value === 'ca' && '🇨🇦'}
              {option.value === 'br' && '🇧🇷'}
            </span>
            <div>
              <div className={selected ? 'font-medium' : ''}>{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </div>
          </div>
        )}
      />
    );
  },
};

// Dark mode
export const DarkMode: Story = {
  render: () => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <div className="dark bg-slate-900 p-6 rounded-lg">
        <ComboBox
          options={countries}
          value={value}
          onChange={setValue}
          placeholder="Select a country..."
        />
      </div>
    );
  },
};
