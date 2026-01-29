/**
 * Toast Notification Provider
 * Wraps app with react-hot-toast Toaster component
 * BOS-UX-02
 */

"use client";

import { Toaster } from "react-hot-toast";

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}
