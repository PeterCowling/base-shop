import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import {
  NotificationContainer,
  type NotificationContainerProps,
  NotificationProvider,
  NotificationProviderWithGlobal,
  toast,
  useNotifications,
  useToast,
} from './NotificationCenter';

const meta: Meta<typeof NotificationContainer> = {
  title: 'Organisms/Operations/NotificationCenter',
  component: NotificationContainer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <NotificationProvider>
        <div className="min-h-[400px] bg-gray-50 p-8 dark:bg-slate-900">
          <Story />
          <NotificationContainer />
        </div>
      </NotificationProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationContainer>;

// Demo component with buttons
function NotificationDemo() {
  const { addNotification, clearAll } = useNotifications();

  return (
    <div className="flex flex-wrap gap-4">
      <button
        onClick={() =>
          addNotification({
            type: 'success',
            title: 'Changes saved',
            description: 'Your changes have been saved successfully.',
          })
        }
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        Success
      </button>
      <button
        onClick={() =>
          addNotification({
            type: 'error',
            title: 'Failed to save',
            description: 'An error occurred while saving your changes.',
          })
        }
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Error
      </button>
      <button
        onClick={() =>
          addNotification({
            type: 'warning',
            title: 'Unsaved changes',
            description: 'You have unsaved changes that will be lost.',
          })
        }
        className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
      >
        Warning
      </button>
      <button
        onClick={() =>
          addNotification({
            type: 'info',
            title: 'New update available',
            description: 'A new version of the application is available.',
          })
        }
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Info
      </button>
      <button
        onClick={clearAll}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Clear All
      </button>
    </div>
  );
}

// Default story
export const Default: Story = {
  render: () => <NotificationDemo />,
};

// With useToast hook
function ToastHookDemo() {
  const toast = useToast();

  return (
    <div className="flex flex-wrap gap-4">
      <button
        onClick={() => toast.success('Changes saved!')}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        toast.success()
      </button>
      <button
        onClick={() => toast.error('Something went wrong')}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        toast.error()
      </button>
      <button
        onClick={() => toast.warning('Please review')}
        className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
      >
        toast.warning()
      </button>
      <button
        onClick={() => toast.info('Did you know?')}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        toast.info()
      </button>
    </div>
  );
}

export const WithToastHook: Story = {
  render: () => <ToastHookDemo />,
};

// With actions
function WithActionsDemo() {
  const { addNotification } = useNotifications();

  return (
    <div className="flex flex-wrap gap-4">
      <button
        onClick={() =>
          addNotification({
            type: 'error',
            title: 'Failed to save',
            description: 'Unable to connect to the server.',
            action: {
              label: 'Retry',
              onClick: () => alert('Retrying...'),
            },
          })
        }
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        With Retry Action
      </button>
      <button
        onClick={() =>
          addNotification({
            type: 'info',
            title: 'New message',
            description: 'You have a new message from John.',
            action: {
              label: 'View',
              onClick: () => alert('Opening message...'),
            },
          })
        }
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        With View Action
      </button>
    </div>
  );
}

export const WithActions: Story = {
  render: () => <WithActionsDemo />,
};

// Promise handling
function PromiseDemo() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const simulateAsync = async (shouldSucceed: boolean) => {
    setLoading(true);
    const promise = new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        if (shouldSucceed) {
          resolve('Data saved successfully');
        } else {
          reject(new Error('Network error'));
        }
      }, 2000);
    });

    try {
      await toast.promise(promise, {
        loading: 'Saving...',
        success: (data) => data,
        error: (err) => (err instanceof Error ? err.message : 'Unknown error'),
      });
    } catch {
      // Error already handled by toast.promise
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <button
        onClick={() => simulateAsync(true)}
        disabled={loading}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Simulate Success (2s)
      </button>
      <button
        onClick={() => simulateAsync(false)}
        disabled={loading}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Simulate Error (2s)
      </button>
    </div>
  );
}

export const WithPromise: Story = {
  render: () => <PromiseDemo />,
};

// Loading notification
function LoadingDemo() {
  const toast = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const startLoading = () => {
    const id = toast.loading('Processing your request...');
    setLoadingId(id);
  };

  const completeLoading = () => {
    if (loadingId) {
      toast.update(loadingId, {
        type: 'success',
        title: 'Request completed!',
        duration: 5000,
        dismissible: true,
      });
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <button
        onClick={startLoading}
        disabled={!!loadingId}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Start Loading
      </button>
      <button
        onClick={completeLoading}
        disabled={!loadingId}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Complete Loading
      </button>
    </div>
  );
}

export const Loading: Story = {
  render: () => <LoadingDemo />,
};

// Persistent notification
function PersistentDemo() {
  const { addNotification } = useNotifications();

  return (
    <button
      onClick={() =>
        addNotification({
          type: 'warning',
          title: 'Session expiring',
          description: 'Your session will expire in 5 minutes.',
          duration: 0, // Persistent
          action: {
            label: 'Extend',
            onClick: () => alert('Session extended'),
          },
        })
      }
      className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
    >
      Show Persistent Notification
    </button>
  );
}

export const Persistent: Story = {
  render: () => <PersistentDemo />,
};

// Non-dismissible
function NonDismissibleDemo() {
  const { addNotification, removeNotification } = useNotifications();
  const [id, setId] = useState<string | null>(null);

  const show = () => {
    const newId = addNotification({
      type: 'info',
      title: 'Important notice',
      description: 'This notification cannot be dismissed by the user.',
      duration: 0,
      dismissible: false,
    });
    setId(newId);
  };

  const dismiss = () => {
    if (id) {
      removeNotification(id);
      setId(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <button
        onClick={show}
        disabled={!!id}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Show Non-Dismissible
      </button>
      <button
        onClick={dismiss}
        disabled={!id}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Dismiss Programmatically
      </button>
    </div>
  );
}

export const NonDismissible: Story = {
  render: () => <NonDismissibleDemo />,
};

// Different positions
function PositionDemo({ position }: NotificationContainerProps) {
  const { addNotification } = useNotifications();

  return (
    <button
      onClick={() =>
        addNotification({
          type: 'info',
          title: `Notification at ${position}`,
        })
      }
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      Show Notification
    </button>
  );
}

export const TopLeft: Story = {
  decorators: [
    (Story) => (
      <NotificationProvider>
        <div className="min-h-[400px] bg-gray-50 p-8">
          <Story />
          <NotificationContainer position="top-left" />
        </div>
      </NotificationProvider>
    ),
  ],
  render: () => <PositionDemo position="top-left" />,
};

export const TopCenter: Story = {
  decorators: [
    (Story) => (
      <NotificationProvider>
        <div className="min-h-[400px] bg-gray-50 p-8">
          <Story />
          <NotificationContainer position="top-center" />
        </div>
      </NotificationProvider>
    ),
  ],
  render: () => <PositionDemo position="top-center" />,
};

export const BottomRight: Story = {
  decorators: [
    (Story) => (
      <NotificationProvider>
        <div className="min-h-[400px] bg-gray-50 p-8">
          <Story />
          <NotificationContainer position="bottom-right" />
        </div>
      </NotificationProvider>
    ),
  ],
  render: () => <PositionDemo position="bottom-right" />,
};

export const BottomCenter: Story = {
  decorators: [
    (Story) => (
      <NotificationProvider>
        <div className="min-h-[400px] bg-gray-50 p-8">
          <Story />
          <NotificationContainer position="bottom-center" />
        </div>
      </NotificationProvider>
    ),
  ],
  render: () => <PositionDemo position="bottom-center" />,
};

// Global toast API
function GlobalToastDemo() {
  return (
    <div className="flex flex-wrap gap-4">
      <button
        onClick={() => toast.success('Global success!')}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        toast.success()
      </button>
      <button
        onClick={() => toast.error('Global error!')}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        toast.error()
      </button>
    </div>
  );
}

export const GlobalAPI: Story = {
  decorators: [
    (Story) => (
      <NotificationProviderWithGlobal>
        <div className="min-h-[400px] bg-gray-50 p-8">
          <Story />
          <NotificationContainer />
        </div>
      </NotificationProviderWithGlobal>
    ),
  ],
  render: () => <GlobalToastDemo />,
};

// Dark mode
export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <div className="dark">
        <NotificationProvider>
          <div className="min-h-[400px] bg-slate-900 p-8">
            <Story />
            <NotificationContainer />
          </div>
        </NotificationProvider>
      </div>
    ),
  ],
  render: () => <NotificationDemo />,
};
