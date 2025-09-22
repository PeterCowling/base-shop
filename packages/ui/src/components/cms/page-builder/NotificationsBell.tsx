"use client";

import React from "react";
import { Popover, PopoverTrigger, PopoverContent, Tooltip } from "../../atoms";

export default function NotificationsBell() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Tooltip text="Notifications">
          <button type="button" aria-label="Notifications" className="rounded border px-2 py-1 text-sm">🔔</button>
        </Tooltip>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 text-sm">
        <div className="text-muted-foreground">No notifications</div>
      </PopoverContent>
    </Popover>
  );
}

