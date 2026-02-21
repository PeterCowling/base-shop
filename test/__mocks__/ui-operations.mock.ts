// Stub for @acme/ui/operations used in CMS/UI tests.
// Provides a no-op useToast so components using NotificationCenter
// can render without a real NotificationProvider in the tree.
//
// The real useToast() returns an object with success/error/warning/info/loading
// methods directly. The mock must match that shape.

import React from "react";

// Passthrough provider stubs so tests can wrap components in NotificationProvider
// without needing a real notification stack.
export const NotificationProvider = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export const NotificationProviderWithGlobal = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export const NotificationContainer = () => null;

export const useToast = () => ({
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  update: jest.fn(),
  promise: jest.fn(),
});

export const useNotifications = () => ({
  notifications: [],
  addNotification: jest.fn(),
  removeNotification: jest.fn(),
  clearAll: jest.fn(),
  updateNotification: jest.fn(),
});

export const toast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
};
