"use client";

import { memo } from "react";
import { Wifi } from "lucide-react";

import { useOnlineStatus } from "../lib/offline/useOnlineStatus";

/**
 * Displays a banner when the app is offline.
 * Shows at the top of the screen to inform users that data may be stale.
 */
function OfflineIndicator() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm font-medium text-primary-fg shadow-md">
      <Wifi className="h-4 w-4" />
      <span>You&apos;re offline. Some features may be unavailable.</span>
    </div>
  );
}

export default memo(OfflineIndicator);
