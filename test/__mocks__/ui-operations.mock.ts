// Stub for @acme/ui/operations used in CMS/UI tests.
// Provides a no-op useToast so components using NotificationCenter
// can render without a real NotificationProvider in the tree.

export const useToast = () => ({ toast: jest.fn() });
