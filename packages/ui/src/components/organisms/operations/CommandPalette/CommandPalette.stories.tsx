import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Search,
  Settings,
  User,
  Mail,
  FileText,
  Home,
  Plus,
  Edit,
  Trash,
  Download,
  Upload,
  LogOut,
  HelpCircle,
  Bell,
  Moon,
  Sun,
} from 'lucide-react';
import { CommandPalette, type CommandItem, type CommandGroup } from './CommandPalette';

const meta: Meta<typeof CommandPalette> = {
  title: 'Organisms/Operations/CommandPalette',
  component: CommandPalette,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

// Sample commands
const basicCommands: CommandItem[] = [
  {
    id: 'search',
    label: 'Search',
    description: 'Search the entire application',
    icon: Search,
    shortcut: '/',
    onSelect: () => console.log('Search'),
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Manage your preferences',
    icon: Settings,
    shortcut: '⌘,',
    onSelect: () => console.log('Settings'),
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'View and edit your profile',
    icon: User,
    onSelect: () => console.log('Profile'),
  },
];

const groupedCommands: CommandGroup[] = [
  {
    id: 'navigation',
    heading: 'Navigation',
    commands: [
      { id: 'home', label: 'Go to Home', icon: Home, onSelect: () => console.log('Home') },
      { id: 'documents', label: 'Go to Documents', icon: FileText, onSelect: () => console.log('Documents') },
      { id: 'messages', label: 'Go to Messages', icon: Mail, onSelect: () => console.log('Messages') },
    ],
  },
  {
    id: 'actions',
    heading: 'Actions',
    commands: [
      { id: 'new', label: 'Create New', icon: Plus, shortcut: '⌘N', onSelect: () => console.log('New') },
      { id: 'edit', label: 'Edit', icon: Edit, shortcut: '⌘E', onSelect: () => console.log('Edit') },
      { id: 'delete', label: 'Delete', icon: Trash, shortcut: '⌘⌫', onSelect: () => console.log('Delete') },
    ],
  },
  {
    id: 'system',
    heading: 'System',
    commands: [
      { id: 'settings', label: 'Settings', icon: Settings, shortcut: '⌘,', onSelect: () => console.log('Settings') },
      { id: 'notifications', label: 'Notifications', icon: Bell, onSelect: () => console.log('Notifications') },
      { id: 'help', label: 'Help & Support', icon: HelpCircle, shortcut: '⌘?', onSelect: () => console.log('Help') },
      { id: 'logout', label: 'Log Out', icon: LogOut, onSelect: () => console.log('Logout') },
    ],
  },
];

// Interactive wrapper for stories
function CommandPaletteDemo({
  commands,
  groups,
  ...props
}: Omit<React.ComponentProps<typeof CommandPalette>, 'open' | 'onOpenChange'> & {
  commands?: CommandItem[];
  groups?: CommandGroup[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-[400px] bg-gray-50 p-8 dark:bg-slate-900">
      <div className="text-center">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Open Command Palette{' '}
          <kbd className="ml-2 rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-xs dark:border-slate-600 dark:bg-slate-700">
            ⌘K
          </kbd>
        </button>
        <p className="mt-4 text-sm text-gray-500 dark:text-slate-400">
          Or press <kbd className="rounded border px-1 text-xs">⌘K</kbd> / <kbd className="rounded border px-1 text-xs">Ctrl+K</kbd>
        </p>
      </div>

      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        commands={commands}
        groups={groups}
        {...props}
      />
    </div>
  );
}

// Basic usage
export const Default: Story = {
  render: () => <CommandPaletteDemo commands={basicCommands} />,
};

// With grouped commands
export const Grouped: Story = {
  render: () => <CommandPaletteDemo groups={groupedCommands} />,
};

// With custom placeholder
export const CustomPlaceholder: Story = {
  render: () => (
    <CommandPaletteDemo
      commands={basicCommands}
      placeholder="What would you like to do?"
    />
  ),
};

// Loading state
export const Loading: Story = {
  render: () => <CommandPaletteDemo commands={basicCommands} loading />,
};

// Empty results
export const EmptyResults: Story = {
  render: () => (
    <CommandPaletteDemo
      commands={[]}
      emptyMessage="No commands available"
    />
  ),
};

// With disabled commands
export const WithDisabledCommands: Story = {
  render: () => {
    const commands: CommandItem[] = [
      ...basicCommands,
      {
        id: 'premium',
        label: 'Premium Feature',
        description: 'Upgrade to access this feature',
        icon: Download,
        disabled: true,
        onSelect: () => {},
      },
    ];
    return <CommandPaletteDemo commands={commands} />;
  },
};

// With submenu indicator
export const WithSubmenus: Story = {
  render: () => {
    const commands: CommandItem[] = [
      {
        id: 'import',
        label: 'Import',
        description: 'Import from various sources',
        icon: Upload,
        hasSubmenu: true,
        onSelect: () => console.log('Would open import submenu'),
      },
      {
        id: 'export',
        label: 'Export',
        description: 'Export to various formats',
        icon: Download,
        hasSubmenu: true,
        onSelect: () => console.log('Would open export submenu'),
      },
      ...basicCommands,
    ];
    return <CommandPaletteDemo commands={commands} />;
  },
};

// With custom footer
export const CustomFooter: Story = {
  render: () => (
    <CommandPaletteDemo
      commands={basicCommands}
      footer={
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Tip: Use keywords to find commands faster</span>
          <button className="text-blue-500 hover:underline">
            View all shortcuts
          </button>
        </div>
      }
    />
  ),
};

// Theme toggle example
export const ThemeToggle: Story = {
  render: () => {
    const [isDark, setIsDark] = useState(false);
    const [open, setOpen] = useState(false);

    const commands: CommandItem[] = [
      {
        id: 'toggle-theme',
        label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        icon: isDark ? Sun : Moon,
        shortcut: '⌘T',
        onSelect: () => setIsDark(!isDark),
      },
      ...basicCommands,
    ];

    return (
      <div className={`min-h-[400px] p-8 ${isDark ? 'dark bg-slate-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            Open Command Palette
          </button>
          <p className={`mt-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Current theme: {isDark ? 'Dark' : 'Light'}
          </p>
        </div>
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          commands={commands}
        />
      </div>
    );
  },
};

// Many commands (scrollable)
export const ManyCommands: Story = {
  render: () => {
    const manyCommands: CommandItem[] = Array.from({ length: 30 }, (_, i) => ({
      id: `command-${i}`,
      label: `Command ${i + 1}`,
      description: `Description for command ${i + 1}`,
      icon: FileText,
      onSelect: () => console.log(`Command ${i + 1}`),
    }));
    return <CommandPaletteDemo commands={manyCommands} />;
  },
};

// With keywords for search
export const WithKeywords: Story = {
  render: () => {
    const commands: CommandItem[] = [
      {
        id: 'settings',
        label: 'Settings',
        description: 'Manage your preferences',
        icon: Settings,
        keywords: ['preferences', 'options', 'config', 'configuration'],
        onSelect: () => console.log('Settings'),
      },
      {
        id: 'profile',
        label: 'Profile',
        description: 'View and edit your profile',
        icon: User,
        keywords: ['account', 'user', 'me', 'personal'],
        onSelect: () => console.log('Profile'),
      },
      {
        id: 'logout',
        label: 'Log Out',
        description: 'Sign out of your account',
        icon: LogOut,
        keywords: ['sign out', 'exit', 'leave'],
        onSelect: () => console.log('Logout'),
      },
    ];
    return (
      <div>
        <CommandPaletteDemo commands={commands} />
        <p className="mt-4 text-center text-xs text-gray-500">
          Try searching for &quot;config&quot;, &quot;account&quot;, or &quot;sign out&quot;
        </p>
      </div>
    );
  },
};

// Dark mode
export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <CommandPaletteDemo groups={groupedCommands} />
    </div>
  ),
};
