Type: Reference
Status: Complete
Domain: Design System
Last-reviewed: 2026-01-16

# UI System Phase 5 - Component Reference (Agent Runbook)

**Date:** 2026-01-12
**Status:** ✅ Complete
**Components:** ComboBox, CommandPalette, NotificationCenter

---

## Overview

Phase 5 introduces three high-impact interactive components:

| Component | Purpose | Bundle |
|-----------|---------|--------|
| **ComboBox** | Searchable select with filtering and multi-select | ~5KB |
| **CommandPalette** | Keyboard-driven command menu (⌘K) | ~4KB |
| **NotificationCenter** | Toast/notification system with queue | ~4KB |

---

## ComboBox

Searchable dropdown with filtering, multi-select, and grouping support.

### Import

```typescript
import { ComboBox, type ComboBoxOption } from '@acme/ui/operations';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `ComboBoxOption<T>[]` | required | Available options |
| `value` | `T \| T[] \| null` | required | Selected value(s) |
| `onChange` | `(value: T \| T[] \| null) => void` | required | Change handler |
| `placeholder` | `string` | "Select an option..." | Placeholder text |
| `searchPlaceholder` | `string` | "Search..." | Search input placeholder |
| `multiple` | `boolean` | `false` | Enable multi-select |
| `disabled` | `boolean` | `false` | Disable the combobox |
| `loading` | `boolean` | `false` | Show loading state |
| `clearable` | `boolean` | `true` | Allow clearing selection |
| `searchable` | `boolean` | `true` | Show search input |
| `filterFn` | `(option, query) => boolean` | - | Custom filter function |
| `onSearch` | `(query: string) => void` | - | Async search handler |
| `emptyMessage` | `string` | "No results found" | Empty state message |
| `renderOption` | `(option, selected) => ReactNode` | - | Custom option renderer |
| `renderValue` | `(selected) => ReactNode` | - | Custom value display |
| `grouped` | `boolean` | `false` | Group options by `group` property |
| `maxSelections` | `number` | - | Limit selections (multiple mode) |
| `closeOnSelect` | `boolean` | `true` | Close after selection (single mode) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| `error` | `string` | - | Error message |

### ComboBoxOption Interface

```typescript
interface ComboBoxOption<T = string> {
  value: T;              // Unique identifier
  label: string;         // Display text
  description?: string;  // Optional description
  disabled?: boolean;    // Disable this option
  icon?: ComponentType;  // Optional icon
  group?: string;        // For grouped display
}
```

### Basic Example

```tsx
const [country, setCountry] = useState<string | null>(null);

const countries = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
];

<ComboBox
  options={countries}
  value={country}
  onChange={setCountry}
  placeholder="Select a country..."
/>
```

### Multi-Select Example

```tsx
const [roles, setRoles] = useState<string[]>([]);

const roleOptions = [
  { value: 'admin', label: 'Admin', group: 'Management' },
  { value: 'editor', label: 'Editor', group: 'Content' },
  { value: 'viewer', label: 'Viewer', group: 'Content' },
];

<ComboBox
  options={roleOptions}
  value={roles}
  onChange={(v) => setRoles(v as string[])}
  placeholder="Select roles..."
  multiple
  grouped
  maxSelections={3}
/>
```

### Async Search Example

```tsx
const [query, setQuery] = useState('');
const [options, setOptions] = useState<ComboBoxOption[]>([]);
const [loading, setLoading] = useState(false);

const handleSearch = async (q: string) => {
  setQuery(q);
  setLoading(true);
  const results = await searchUsers(q);
  setOptions(results.map(u => ({
    value: u.id,
    label: u.name,
    description: u.email,
  })));
  setLoading(false);
};

<ComboBox
  options={options}
  value={selectedUser}
  onChange={setSelectedUser}
  onSearch={handleSearch}
  loading={loading}
  placeholder="Search users..."
/>
```

---

## CommandPalette

Keyboard-driven command menu with fuzzy search and keyboard navigation.

### Import

```typescript
import { CommandPalette, type CommandItem, type CommandGroup } from '@acme/ui/operations';
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | required | Whether palette is open |
| `onOpenChange` | `(open: boolean) => void` | required | Open state handler |
| `commands` | `CommandItem[]` | `[]` | Flat list of commands |
| `groups` | `CommandGroup[]` | `[]` | Grouped commands (takes precedence) |
| `placeholder` | `string` | "Type a command or search..." | Search placeholder |
| `emptyMessage` | `string` | "No results found." | Empty state message |
| `loading` | `boolean` | `false` | Show loading state |
| `onSearch` | `(query: string) => void` | - | Async search handler |
| `filterFn` | `(command, query) => boolean` | - | Custom filter |
| `footer` | `ReactNode` | - | Custom footer content |
| `shortcutKey` | `string` | `'k'` | Key to open (with Cmd/Ctrl) |
| `useMetaKey` | `boolean` | `true` | Use Cmd on Mac, Ctrl elsewhere |

### CommandItem Interface

```typescript
interface CommandItem {
  id: string;              // Unique identifier
  label: string;           // Display text
  description?: string;    // Optional subtitle
  icon?: ComponentType;    // Optional icon
  shortcut?: string;       // Keyboard shortcut hint
  onSelect: () => void;    // Selection handler
  group?: string;          // Optional category
  disabled?: boolean;      // Disable this command
  keywords?: string[];     // Search keywords
  hasSubmenu?: boolean;    // Show arrow indicator
}
```

### CommandGroup Interface

```typescript
interface CommandGroup {
  id: string;
  heading: string;
  commands: CommandItem[];
}
```

### Basic Example

```tsx
const [open, setOpen] = useState(false);

const commands: CommandItem[] = [
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    shortcut: '/',
    onSelect: () => focusSearch(),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    shortcut: '⌘,',
    onSelect: () => router.push('/settings'),
  },
];

<CommandPalette
  open={open}
  onOpenChange={setOpen}
  commands={commands}
/>
```

### Grouped Commands Example

```tsx
const groups: CommandGroup[] = [
  {
    id: 'navigation',
    heading: 'Navigation',
    commands: [
      { id: 'home', label: 'Home', icon: Home, onSelect: () => goto('/') },
      { id: 'docs', label: 'Documents', icon: FileText, onSelect: () => goto('/docs') },
    ],
  },
  {
    id: 'actions',
    heading: 'Actions',
    commands: [
      { id: 'new', label: 'Create New', icon: Plus, shortcut: '⌘N', onSelect: createNew },
      { id: 'edit', label: 'Edit', icon: Edit, onSelect: editCurrent },
    ],
  },
];

<CommandPalette
  open={open}
  onOpenChange={setOpen}
  groups={groups}
/>
```

### Keyboard Support

- `⌘K` / `Ctrl+K` - Open/close palette
- `↑` / `↓` - Navigate commands
- `Enter` - Select command
- `Escape` - Close palette

---

## NotificationCenter

Toast notification system with queue management and promise handling.

### Import

```typescript
import {
  NotificationProvider,
  NotificationProviderWithGlobal,
  NotificationContainer,
  useNotifications,
  useToast,
  toast,
  type Notification,
  type NotificationOptions,
} from '@acme/ui/operations';
```

### Setup

Wrap the app with the provider and add the container:

```tsx
// In the root layout
import { NotificationProvider, NotificationContainer } from '@acme/ui/operations';

function App({ children }) {
  return (
    <NotificationProvider>
      {children}
      <NotificationContainer position="top-right" />
    </NotificationProvider>
  );
}
```

### NotificationProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `maxNotifications` | `number` | `5` | Max visible notifications |
| `defaultDuration` | `number` | `5000` | Default duration (ms) |

### NotificationContainer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `Position` | `'top-right'` | Position on screen |

**Position options:** `'top-left'`, `'top-right'`, `'top-center'`, `'bottom-left'`, `'bottom-right'`, `'bottom-center'`

### useNotifications Hook

```typescript
const {
  notifications,        // Current notifications array
  addNotification,      // Add a notification, returns ID
  removeNotification,   // Remove by ID
  clearAll,             // Clear all notifications
  updateNotification,   // Update existing notification
} = useNotifications();
```

### useToast Hook

Convenience methods for common notification types:

```typescript
const toast = useToast();

// Type-specific methods
toast.success('Changes saved');
toast.error('Something went wrong', { description: 'Please try again' });
toast.warning('Unsaved changes');
toast.info('New update available');
toast.loading('Uploading...');  // Persistent until dismissed

// Dismiss and update
toast.dismiss(id);
toast.update(id, { type: 'success', title: 'Done!' });

// Promise handling
await toast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Saved successfully!',
  error: (err) => `Failed: ${err.message}`,
});
```

### NotificationOptions

```typescript
interface NotificationOptions {
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  description?: string;
  duration?: number;      // 0 = persistent
  dismissible?: boolean;  // Show X button
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}
```

### Basic Example

```tsx
function SaveButton() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast.success('Changes saved');
    } catch (err) {
      toast.error('Failed to save', {
        action: {
          label: 'Retry',
          onClick: handleSave,
        },
      });
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Promise Example

```tsx
function UploadButton() {
  const toast = useToast();

  const handleUpload = async () => {
    await toast.promise(uploadFile(file), {
      loading: 'Uploading...',
      success: (result) => `Uploaded ${result.name}`,
      error: 'Upload failed',
    });
  };

  return <button onClick={handleUpload}>Upload</button>;
}
```

### Global Toast API

For use outside React components (e.g., in utilities):

```tsx
// Use NotificationProviderWithGlobal instead of NotificationProvider
<NotificationProviderWithGlobal>
  {children}
  <NotificationContainer />
</NotificationProviderWithGlobal>

// Then anywhere in the code:
import { toast } from '@acme/ui/operations';

toast.success('Done!');
toast.error('Failed');
```

---

## Accessibility

All Phase 5 components meet WCAG 2.1 AA:

### ComboBox
- `role="listbox"` with `aria-multiselectable`
- `aria-expanded`, `aria-haspopup` on trigger
- `aria-selected`, `aria-disabled` on options
- Full keyboard navigation (Arrow, Enter, Escape)

### CommandPalette
- `role="dialog"` with `aria-modal`
- `role="listbox"` for command list
- `aria-selected` for highlighted item
- Focus trap within dialog
- Full keyboard navigation

### NotificationCenter
- `role="alert"` for notifications
- `role="region"` with `aria-label` for container
- Auto-dismiss with sufficient duration
- Dismissible with keyboard

---

## Dark Mode

All components fully support dark mode:

```tsx
// Components automatically adapt to dark mode via Tailwind
<div className="dark">
  <ComboBox ... />
  <CommandPalette ... />
  <NotificationContainer />
</div>
```

---

## Testing

Each component includes comprehensive tests:

- **ComboBox:** 15 tests (selection, filtering, keyboard, disabled states)
- **CommandPalette:** 17 tests (rendering, search, navigation, shortcuts)
- **NotificationCenter:** 13 tests (add/remove, auto-dismiss, actions)

**Total:** 45 tests, 100% coverage

---

## Stories

Storybook coverage for all variants:

- **ComboBox:** 14 stories (single, multiple, grouped, async, custom render)
- **CommandPalette:** 12 stories (basic, grouped, loading, keyboard, dark)
- **NotificationCenter:** 13 stories (all types, actions, promise, positions)

**Total:** 39 stories

---

## Bundle Size

| Component | Gzipped |
|-----------|---------|
| ComboBox | ~5KB |
| CommandPalette | ~4KB |
| NotificationCenter | ~4KB |
| **Total Phase 5** | **~13KB** |

---

## Integration Examples

### ComboBox in Form

```tsx
import { ComboBox } from '@acme/ui/operations';

function UserForm() {
  const [country, setCountry] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  return (
    <form>
      <label>Country</label>
      <ComboBox
        options={countries}
        value={country}
        onChange={setCountry}
        error={!country ? 'Required' : undefined}
      />

      <label>Roles</label>
      <ComboBox
        options={roleOptions}
        value={roles}
        onChange={(v) => setRoles(v as string[])}
        multiple
        maxSelections={3}
      />
    </form>
  );
}
```

### CommandPalette in App

```tsx
import { CommandPalette } from '@acme/ui/operations';

function AppLayout({ children }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const commands = useMemo(() => [
    { id: 'home', label: 'Home', icon: Home, onSelect: () => router.push('/') },
    { id: 'search', label: 'Search', icon: Search, shortcut: '/', onSelect: openSearch },
    { id: 'settings', label: 'Settings', icon: Settings, shortcut: '⌘,', onSelect: () => router.push('/settings') },
    { id: 'theme', label: 'Toggle Theme', icon: Moon, onSelect: toggleTheme },
  ], [router]);

  return (
    <>
      {children}
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        commands={commands}
      />
    </>
  );
}
```

### NotificationCenter in App

```tsx
import { NotificationProvider, NotificationContainer } from '@acme/ui/operations';

function RootLayout({ children }) {
  return (
    <NotificationProvider maxNotifications={3}>
      {children}
      <NotificationContainer position="bottom-right" />
    </NotificationProvider>
  );
}

// In any component
function SaveButton() {
  const toast = useToast();

  return (
    <button onClick={async () => {
      await toast.promise(saveChanges(), {
        loading: 'Saving...',
        success: 'Saved!',
        error: 'Failed to save',
      });
    }}>
      Save
    </button>
  );
}
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-12
**Status:** ✅ Complete
