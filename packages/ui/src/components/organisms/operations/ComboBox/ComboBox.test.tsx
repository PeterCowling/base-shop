import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComboBox, type ComboBoxOption } from './ComboBox';

const mockOptions: ComboBoxOption[] = [
  { value: 'us', label: 'United States', description: 'North America' },
  { value: 'uk', label: 'United Kingdom', description: 'Europe' },
  { value: 'de', label: 'Germany', description: 'Europe' },
  { value: 'fr', label: 'France', description: 'Europe' },
];

const groupedOptions: ComboBoxOption[] = [
  { value: 'admin', label: 'Admin', group: 'Roles' },
  { value: 'user', label: 'User', group: 'Roles' },
  { value: 'read', label: 'Read', group: 'Permissions' },
  { value: 'write', label: 'Write', group: 'Permissions' },
];

describe('ComboBox', () => {
  it('renders with placeholder', () => {
    render(
      <ComboBox
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Select a country..."
      />
    );

    expect(screen.getByText('Select a country...')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(
      <ComboBox
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Select..."
      />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
  });

  it('filters options based on search query', async () => {
    const user = userEvent.setup();
    render(
      <ComboBox
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Select..."
      />
    );

    await user.click(screen.getByRole('button'));
    await user.type(screen.getByPlaceholderText('Search...'), 'united');

    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
    expect(screen.queryByText('Germany')).not.toBeInTheDocument();
  });

  it('calls onChange when option is selected', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <ComboBox
        options={mockOptions}
        value={null}
        onChange={handleChange}
        placeholder="Select..."
      />
    );

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Germany'));

    expect(handleChange).toHaveBeenCalledWith('de');
  });

  it('displays selected value', () => {
    render(
      <ComboBox
        options={mockOptions}
        value="uk"
        onChange={() => {}}
        placeholder="Select..."
      />
    );

    expect(screen.getByText('United Kingdom')).toBeInTheDocument();
  });

  it('supports multiple selection', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <ComboBox
        options={mockOptions}
        value={['us']}
        onChange={handleChange}
        placeholder="Select..."
        multiple
      />
    );

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Germany'));

    expect(handleChange).toHaveBeenCalledWith(['us', 'de']);
  });

  it('clears selection when clear button is clicked', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <ComboBox
        options={mockOptions}
        value="uk"
        onChange={handleChange}
        placeholder="Select..."
        clearable
      />
    );

    await user.click(screen.getByLabelText('Clear selection'));
    expect(handleChange).toHaveBeenCalledWith(null);
  });

  it('respects disabled state', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <ComboBox
        options={mockOptions}
        value={null}
        onChange={handleChange}
        placeholder="Select..."
        disabled
      />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('displays error message', () => {
    render(
      <ComboBox
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Select..."
        error="Please select a country"
      />
    );

    expect(screen.getByText('Please select a country')).toBeInTheDocument();
  });

  it('supports grouped options', async () => {
    const user = userEvent.setup();

    render(
      <ComboBox
        options={groupedOptions}
        value={null}
        onChange={() => {}}
        placeholder="Select..."
        grouped
      />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
  });

  it('respects maxSelections in multiple mode', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <ComboBox
        options={mockOptions}
        value={['us', 'uk']}
        onChange={handleChange}
        placeholder="Select..."
        multiple
        maxSelections={2}
      />
    );

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByText('Germany'));

    // Should not be called because maxSelections is reached
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('handles keyboard navigation', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(
      <ComboBox
        options={mockOptions}
        value={null}
        onChange={handleChange}
        placeholder="Select..."
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // Press down arrow to highlight first option
    fireEvent.keyDown(button.parentElement!, { key: 'ArrowDown' });
    // Press Enter to select
    fireEvent.keyDown(button.parentElement!, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalled();
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();

    render(
      <ComboBox
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Select..."
      />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('button').parentElement!, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    render(
      <ComboBox
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Select..."
        loading
      />
    );

    // Loading spinner should be visible
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('hides search input when searchable is false', async () => {
    const user = userEvent.setup();

    render(
      <ComboBox
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Select..."
        searchable={false}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });
});
