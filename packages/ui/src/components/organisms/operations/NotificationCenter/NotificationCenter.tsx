import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Loader2,
} from "lucide-react";
import { useTranslations } from "@acme/i18n";
import { Inline, Stack } from "../../../atoms/primitives";
import { cn } from "../../../../utils/style/cn";

export type NotificationType = "success" | "error" | "warning" | "info" | "loading";

export interface Notification {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Notification type
   */
  type: NotificationType;

  /**
   * Title text
   */
  title: string;

  /**
   * Optional description
   */
  description?: string;

  /**
   * Duration in milliseconds (0 = persistent)
   * @default 5000
   */
  duration?: number;

  /**
   * Whether the notification is dismissible
   * @default true
   */
  dismissible?: boolean;

  /**
   * Optional action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };

  /**
   * Callback when notification is dismissed
   */
  onDismiss?: () => void;

  /**
   * Creation timestamp
   */
  createdAt: number;
}

export interface NotificationOptions {
  type?: NotificationType;
  title: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (options: NotificationOptions) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  updateNotification: (id: string, options: Partial<NotificationOptions>) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * Hook to access the notification system
 *
 * @example
 * ```tsx
 * const { addNotification, removeNotification } = useNotifications();
 *
 * // Add a success notification
 * addNotification({
 *   type: 'success',
 *   title: 'Changes saved',
 *   description: 'Your changes have been saved successfully.',
 * });
 *
 * // Add notification with action
 * addNotification({
 *   type: 'error',
 *   title: 'Failed to save',
 *   action: {
 *     label: 'Retry',
 *     onClick: () => saveChanges(),
 *   },
 * });
 * ```
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    // i18n-exempt -- UI-3011 [ttl=2026-12-31] developer-facing error message
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

// Convenience hooks for common notification types
export function useToast() {
  const { addNotification, removeNotification, updateNotification } = useNotifications();

  return useMemo(
    () => ({
      success: (title: string, options?: Omit<NotificationOptions, 'type' | 'title'>) =>
        addNotification({ type: "success", title, ...options }),
      error: (title: string, options?: Omit<NotificationOptions, 'type' | 'title'>) =>
        addNotification({ type: "error", title, ...options }),
      warning: (title: string, options?: Omit<NotificationOptions, 'type' | 'title'>) =>
        addNotification({ type: "warning", title, ...options }),
      info: (title: string, options?: Omit<NotificationOptions, 'type' | 'title'>) =>
        addNotification({ type: "info", title, ...options }),
      loading: (title: string, options?: Omit<NotificationOptions, 'type' | 'title'>) =>
        addNotification({ type: "loading", title, duration: 0, ...options }),
      dismiss: removeNotification,
      update: updateNotification,
      promise: async <T,>(
        promise: Promise<T>,
        options: {
          loading: string;
          success: string | ((data: T) => string);
          error: string | ((err: unknown) => string);
        }
      ): Promise<T> => {
        const id = addNotification({
          type: "loading",
          title: options.loading,
          duration: 0,
          dismissible: false,
        });

        try {
          const result = await promise;
          updateNotification(id, {
            type: "success",
            title: typeof options.success === 'function' ? options.success(result) : options.success,
            duration: 5000,
            dismissible: true,
          });
          return result;
        } catch (err) {
          updateNotification(id, {
            type: "error",
            title: typeof options.error === 'function' ? options.error(err) : options.error,
            duration: 5000,
            dismissible: true,
          });
          throw err;
        }
      },
    }),
    [addNotification, removeNotification, updateNotification]
  );
}

let notificationId = 0;
const generateId = () => `notification-${++notificationId}`;

export interface NotificationProviderProps {
  children: React.ReactNode;
  /**
   * Maximum number of notifications to show
   * @default 5
   */
  maxNotifications?: number;
  /**
   * Default duration for notifications (ms)
   * @default 5000
   */
  defaultDuration?: number;
}

/**
 * Provider for the notification system
 */
export function NotificationProvider({
  children,
  maxNotifications = 5,
  defaultDuration = 5000,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (options: NotificationOptions) => {
      const id = generateId();
      const notification: Notification = {
        id,
        type: options.type ?? "info",
        title: options.title,
        description: options.description,
        duration: options.duration ?? defaultDuration,
        dismissible: options.dismissible ?? true,
        action: options.action,
        onDismiss: options.onDismiss,
        createdAt: Date.now(),
      };

      setNotifications((prev) => {
        const newList = [notification, ...prev];
        return newList.slice(0, maxNotifications);
      });

      return id;
    },
    [defaultDuration, maxNotifications]
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === id);
      notification?.onDismiss?.();
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  const updateNotification = useCallback(
    (id: string, options: Partial<NotificationOptions>) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                ...options,
                createdAt: options.type ? Date.now() : n.createdAt, // Reset timer on type change
              }
            : n
        )
      );
    },
    []
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const contextValue = useMemo(
    () => ({
      notifications,
      addNotification,
      removeNotification,
      clearAll,
      updateNotification,
    }),
    [notifications, addNotification, removeNotification, clearAll, updateNotification]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export interface NotificationContainerProps {
  /**
   * Position on the screen
   * @default "top-right"
   */
  position?: "top-left" | "top-right" | "top-center" | "bottom-left" | "bottom-right" | "bottom-center";

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Container component that renders notifications
 * Should be placed at the root of your app, inside NotificationProvider
 */
export function NotificationContainer({
  position = "top-right",
  className = "",
}: NotificationContainerProps) {
  const { notifications, removeNotification } = useNotifications();
  const t = useTranslations();

  const positionClasses: Record<string, string> = {
    "top-left": "top-4 start-4",
    "top-right": "top-4 end-4",
    "top-center": "top-4 start-1/2 -translate-x-1/2",
    "bottom-left": "bottom-4 start-4",
    "bottom-right": "bottom-4 end-4",
    "bottom-center": "bottom-4 start-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={cn(
        "fixed z-[100] flex flex-col gap-2 pointer-events-none",
        positionClasses[position],
        className
      )}
      role="region"
      aria-label={t("notifications.ariaLabel")}
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const { type, title, description, duration, dismissible, action } = notification;
  const t = useTranslations();

  // Auto-dismiss timer
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const icons: Record<NotificationType, React.ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-success" />,
    error: <XCircle className="h-5 w-5 text-danger" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-info" />,
    loading: <Loader2 className="h-5 w-5 animate-spin text-info" />,
  };

  const bgColors: Record<NotificationType, string> = {
    success: "bg-success-soft border-success/30",
    error: "bg-danger-soft border-danger/30",
    warning: "bg-warning-soft border-warning/30",
    info: "bg-info-soft border-info/30",
    loading: "bg-info-soft border-info/30",
  };

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto w-80 rounded-lg border p-4 shadow-elevation-3",
        "animate-in slide-in-from-right-full fade-in duration-200",
        bgColors[type]
      )}
    >
      <Inline gap={3} alignY="start" wrap={false}>
        <div className="flex-shrink-0">{icons[type]}</div>
        <Stack gap={1} className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">{title}</p>
          {description && (
            <p className="text-sm text-muted">
              {description}
            </p>
          )}
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className={cn(
                "inline-flex min-h-11 min-w-11 items-center text-sm font-medium text-info",
                "hover:text-info/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              {action.label}
            </button>
          )}
        </Stack>
        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className={cn(
              "min-h-11 min-w-11 flex-shrink-0 rounded text-muted",
              "hover:bg-surface-2 hover:text-fg",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
            aria-label={t("notifications.dismiss")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </Inline>
    </div>
  );
}

// Standalone toast functions for use outside React components
let externalAddNotification: ((options: NotificationOptions) => string) | null = null;
let externalRemoveNotification: ((id: string) => void) | null = null;

/**
 * Standalone toast API for use outside React components
 * Must be used with NotificationProviderWithGlobal
 */
export const toast = {
  success: (title: string, options?: Omit<NotificationOptions, 'type' | 'title'>) => {
    if (!externalAddNotification) {
      // i18n-exempt -- UI-3011 [ttl=2026-12-31] developer warning
      console.warn("NotificationProviderWithGlobal is not mounted");
      return "";
    }
    return externalAddNotification({ type: "success", title, ...options });
  },
  error: (title: string, options?: Omit<NotificationOptions, 'type' | 'title'>) => {
    if (!externalAddNotification) {
      // i18n-exempt -- UI-3011 [ttl=2026-12-31] developer warning
      console.warn("NotificationProviderWithGlobal is not mounted");
      return "";
    }
    return externalAddNotification({ type: "error", title, ...options });
  },
  warning: (title: string, options?: Omit<NotificationOptions, 'type' | 'title'>) => {
    if (!externalAddNotification) {
      // i18n-exempt -- UI-3011 [ttl=2026-12-31] developer warning
      console.warn("NotificationProviderWithGlobal is not mounted");
      return "";
    }
    return externalAddNotification({ type: "warning", title, ...options });
  },
  info: (title: string, options?: Omit<NotificationOptions, 'type' | 'title'>) => {
    if (!externalAddNotification) {
      // i18n-exempt -- UI-3011 [ttl=2026-12-31] developer warning
      console.warn("NotificationProviderWithGlobal is not mounted");
      return "";
    }
    return externalAddNotification({ type: "info", title, ...options });
  },
  loading: (title: string, options?: Omit<NotificationOptions, 'type' | 'title'>) => {
    if (!externalAddNotification) {
      // i18n-exempt -- UI-3011 [ttl=2026-12-31] developer warning
      console.warn("NotificationProviderWithGlobal is not mounted");
      return "";
    }
    return externalAddNotification({ type: "loading", title, duration: 0, ...options });
  },
  dismiss: (id: string) => {
    if (!externalRemoveNotification) {
      // i18n-exempt -- UI-3011 [ttl=2026-12-31] developer warning
      console.warn("NotificationProviderWithGlobal is not mounted");
      return;
    }
    externalRemoveNotification(id);
  },
};

/**
 * NotificationProvider with global toast API support
 */
export function NotificationProviderWithGlobal({
  children,
  ...props
}: NotificationProviderProps) {
  return (
    <NotificationProvider {...props}>
      <GlobalToastBridge />
      {children}
    </NotificationProvider>
  );
}

function GlobalToastBridge() {
  const { addNotification, removeNotification } = useNotifications();

  useEffect(() => {
    externalAddNotification = addNotification;
    externalRemoveNotification = removeNotification;

    return () => {
      externalAddNotification = null;
      externalRemoveNotification = null;
    };
  }, [addNotification, removeNotification]);

  return null;
}

export default NotificationContainer;
