import React from 'react';
import { act,fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  NotificationContainer,
  NotificationProvider,
  useNotifications,
  useToast,
} from './NotificationCenter';

// Test component that uses the notification hooks
function TestComponent() {
  const { addNotification, clearAll } = useNotifications();

  return (
    <div>
      <button
        onClick={() =>
          addNotification({
            type: 'success',
            title: 'Success message',
            description: 'This is a success notification',
          })
        }
      >
        Add Success
      </button>
      <button
        onClick={() =>
          addNotification({
            type: 'error',
            title: 'Error message',
          })
        }
      >
        Add Error
      </button>
      <button onClick={clearAll}>Clear All</button>
    </div>
  );
}

function ToastTestComponent() {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success('Success!')}>Success Toast</button>
      <button onClick={() => toast.error('Error!')}>Error Toast</button>
      <button onClick={() => toast.warning('Warning!')}>Warning Toast</button>
      <button onClick={() => toast.info('Info!')}>Info Toast</button>
      <button onClick={() => toast.loading('Loading...')}>Loading Toast</button>
    </div>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(
    <NotificationProvider>
      {ui}
      <NotificationContainer />
    </NotificationProvider>
  );
}

describe('NotificationCenter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('NotificationProvider', () => {
    it('provides notification context', () => {
      renderWithProvider(<TestComponent />);
      expect(screen.getByText('Add Success')).toBeInTheDocument();
    });

    it('throws error when useNotifications is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useNotifications must be used within a NotificationProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('addNotification', () => {
    it('adds a success notification', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProvider(<TestComponent />);

      await user.click(screen.getByText('Add Success'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('This is a success notification')).toBeInTheDocument();
    });

    it('adds an error notification', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProvider(<TestComponent />);

      await user.click(screen.getByText('Add Error'));

      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('auto-dismisses notification after duration', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProvider(<TestComponent />);

      await user.click(screen.getByText('Add Success'));
      expect(screen.getByText('Success message')).toBeInTheDocument();

      // Fast-forward past the default duration (5000ms)
      act(() => {
        jest.advanceTimersByTime(5100);
      });

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      });
    });
  });

  describe('clearAll', () => {
    it('clears all notifications', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProvider(<TestComponent />);

      // Add multiple notifications
      await user.click(screen.getByText('Add Success'));
      await user.click(screen.getByText('Add Error'));

      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();

      await user.click(screen.getByText('Clear All'));

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
        expect(screen.queryByText('Error message')).not.toBeInTheDocument();
      });
    });
  });

  describe('dismissible notifications', () => {
    it('can be dismissed by clicking X', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProvider(<TestComponent />);

      await user.click(screen.getByText('Add Success'));
      expect(screen.getByText('Success message')).toBeInTheDocument();

      await user.click(screen.getByLabelText('Dismiss'));

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument();
      });
    });
  });

  describe('useToast hook', () => {
    it('provides convenience methods for different notification types', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProvider(<ToastTestComponent />);

      await user.click(screen.getByText('Success Toast'));
      expect(screen.getByText('Success!')).toBeInTheDocument();

      await user.click(screen.getByText('Error Toast'));
      expect(screen.getByText('Error!')).toBeInTheDocument();

      await user.click(screen.getByText('Warning Toast'));
      expect(screen.getByText('Warning!')).toBeInTheDocument();

      await user.click(screen.getByText('Info Toast'));
      expect(screen.getByText('Info!')).toBeInTheDocument();
    });

    it('creates loading notification with no auto-dismiss', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProvider(<ToastTestComponent />);

      await user.click(screen.getByText('Loading Toast'));
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Fast-forward past normal duration
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Loading notification should still be there
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('NotificationContainer', () => {
    it('renders in different positions', () => {
      const { rerender } = render(
        <NotificationProvider>
          <NotificationContainer position="top-left" />
        </NotificationProvider>
      );

      const container = screen.getByRole('region');
      expect(container).toHaveClass('top-4', 'left-4');

      rerender(
        <NotificationProvider>
          <NotificationContainer position="bottom-right" />
        </NotificationProvider>
      );

      expect(container).toHaveClass('bottom-4', 'right-4');
    });
  });

  describe('notification with action', () => {
    it('renders action button', async () => {
      function ActionTestComponent() {
        const { addNotification } = useNotifications();

        return (
          <button
            onClick={() =>
              addNotification({
                type: 'error',
                title: 'Error occurred',
                action: {
                  label: 'Retry',
                  onClick: () => {},
                },
              })
            }
          >
            Add With Action
          </button>
        );
      }

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProvider(<ActionTestComponent />);

      await user.click(screen.getByText('Add With Action'));

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('calls action onClick when clicked', async () => {
      const handleRetry = jest.fn();

      function ActionTestComponent() {
        const { addNotification } = useNotifications();

        return (
          <button
            onClick={() =>
              addNotification({
                type: 'error',
                title: 'Error occurred',
                action: {
                  label: 'Retry',
                  onClick: handleRetry,
                },
              })
            }
          >
            Add With Action
          </button>
        );
      }

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderWithProvider(<ActionTestComponent />);

      await user.click(screen.getByText('Add With Action'));
      await user.click(screen.getByText('Retry'));

      expect(handleRetry).toHaveBeenCalled();
    });
  });

  describe('max notifications limit', () => {
    it('limits number of displayed notifications', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      function ManyNotificationsComponent() {
        const { addNotification } = useNotifications();

        return (
          <button
            onClick={() => {
              for (let i = 0; i < 10; i++) {
                addNotification({
                  type: 'info',
                  title: `Notification ${i + 1}`,
                  duration: 0, // Persistent
                });
              }
            }}
          >
            Add Many
          </button>
        );
      }

      render(
        <NotificationProvider maxNotifications={3}>
          <ManyNotificationsComponent />
          <NotificationContainer />
        </NotificationProvider>
      );

      await user.click(screen.getByText('Add Many'));

      // Should only show max 3 notifications
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(3);
    });
  });
});
