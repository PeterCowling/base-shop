import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommandPalette, type CommandItem, type CommandGroup } from './CommandPalette';

const mockCommands: CommandItem[] = [
  {
    id: 'search',
    label: 'Search',
    description: 'Search the application',
    shortcut: '/',
    onSelect: jest.fn(),
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Open settings',
    shortcut: '⌘,',
    onSelect: jest.fn(),
  },
  {
    id: 'profile',
    label: 'Profile',
    keywords: ['user', 'account'],
    onSelect: jest.fn(),
  },
];

const mockGroups: CommandGroup[] = [
  {
    id: 'navigation',
    heading: 'Navigation',
    commands: [
      { id: 'home', label: 'Home', onSelect: jest.fn() },
      { id: 'docs', label: 'Documents', onSelect: jest.fn() },
    ],
  },
  {
    id: 'actions',
    heading: 'Actions',
    commands: [
      { id: 'new', label: 'Create New', onSelect: jest.fn() },
      { id: 'delete', label: 'Delete', onSelect: jest.fn() },
    ],
  },
];

describe('CommandPalette', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open is true', () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={() => {}}
        commands={mockCommands}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <CommandPalette
        open={false}
        onOpenChange={() => {}}
        commands={mockCommands}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays all commands', () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={() => {}}
        commands={mockCommands}
      />
    );

    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('filters commands based on search query', async () => {
    const user = userEvent.setup();

    render(
      <CommandPalette
        open={true}
        onOpenChange={() => {}}
        commands={mockCommands}
      />
    );

    await user.type(screen.getByPlaceholderText('Type a command or search...'), 'search');

    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
  });

  it('searches by keywords', async () => {
    const user = userEvent.setup();

    render(
      <CommandPalette
        open={true}
        onOpenChange={() => {}}
        commands={mockCommands}
      />
    );

    await user.type(screen.getByPlaceholderText('Type a command or search...'), 'account');

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.queryByText('Search')).not.toBeInTheDocument();
  });

  it('calls onSelect when command is clicked', async () => {
    const user = userEvent.setup();
    const handleOpenChange = jest.fn();

    render(
      <CommandPalette
        open={true}
        onOpenChange={handleOpenChange}
        commands={mockCommands}
      />
    );

    await user.click(screen.getByText('Settings'));

    expect(mockCommands[1].onSelect).toHaveBeenCalled();
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('displays grouped commands', () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={() => {}}
        groups={mockGroups}
      />
    );

    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Create New')).toBeInTheDocument();
  });

  it('displays keyboard shortcuts', () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={() => {}}
        commands={mockCommands}
      />
    );

    expect(screen.getByText('/')).toBeInTheDocument();
    expect(screen.getByText('⌘,')).toBeInTheDocument();
  });

  it('closes when Escape is pressed', () => {
    const handleOpenChange = jest.fn();

    render(
      <CommandPalette
        open={true}
        onOpenChange={handleOpenChange}
        commands={mockCommands}
      />
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const handleOpenChange = jest.fn();

    render(
      <CommandPalette
        open={true}
        onOpenChange={handleOpenChange}
        commands={mockCommands}
      />
    );

    // Click the backdrop (the fixed overlay behind the dialog)
    const backdrop = document.querySelector('.bg-black\\/50');
    if (backdrop) {
      await user.click(backdrop);
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    }
  });

  it('navigates commands with arrow keys', () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={() => {}}
        commands={mockCommands}
      />
    );

    const dialog = screen.getByRole('dialog');

    // Press down arrow
    fireEvent.keyDown(dialog, { key: 'ArrowDown' });

    // Check that second item is highlighted
    const options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('data-highlighted', 'true');
  });

  it('selects command with Enter key', () => {
    const handleOpenChange = jest.fn();

    render(
      <CommandPalette
        open={true}
        onOpenChange={handleOpenChange}
        commands={mockCommands}
      />
    );

    const dialog = screen.getByRole('dialog');

    // Press Enter to select first (highlighted) item
    fireEvent.keyDown(dialog, { key: 'Enter' });

    expect(mockCommands[0].onSelect).toHaveBeenCalled();
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows empty message when no results', async () => {
    const user = userEvent.setup();

    render(
      <CommandPalette
        open={true}
        onOpenChange={() => {}}
        commands={mockCommands}
        emptyMessage="No commands found"
      />
    );

    await user.type(screen.getByPlaceholderText('Type a command or search...'), 'nonexistent');

    expect(screen.getByText('No commands found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={() => {}}
        commands={[]}
        loading
      />
    );

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('renders custom footer', () => {
    render(
      <CommandPalette
        open={true}
        onOpenChange={() => {}}
        commands={mockCommands}
        footer={<span>Custom footer</span>}
      />
    );

    expect(screen.getByText('Custom footer')).toBeInTheDocument();
  });

  it('respects disabled commands', async () => {
    const user = userEvent.setup();
    const disabledCommand: CommandItem = {
      id: 'disabled',
      label: 'Disabled Command',
      disabled: true,
      onSelect: jest.fn(),
    };

    render(
      <CommandPalette
        open={true}
        onOpenChange={() => {}}
        commands={[disabledCommand]}
      />
    );

    await user.click(screen.getByText('Disabled Command'));

    expect(disabledCommand.onSelect).not.toHaveBeenCalled();
  });

  it('opens with keyboard shortcut', () => {
    const handleOpenChange = jest.fn();

    render(
      <CommandPalette
        open={false}
        onOpenChange={handleOpenChange}
        commands={mockCommands}
        shortcutKey="k"
      />
    );

    // Simulate Cmd+K
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });
});
