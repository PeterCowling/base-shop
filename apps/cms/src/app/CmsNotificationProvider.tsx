"use client";

import type { ReactNode } from "react";

import {
  NotificationContainer,
  NotificationProvider,
} from "@acme/ui/operations";

export function CmsNotificationProvider({ children }: { children: ReactNode }) {
  return (
    <NotificationProvider>
      {children}
      <NotificationContainer position="top-right" />
    </NotificationProvider>
  );
}
