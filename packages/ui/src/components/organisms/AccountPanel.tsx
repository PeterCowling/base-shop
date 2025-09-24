"use client";
import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";

export interface AccountInfo {
  name: string;
  email: string;
  avatar?: string;
}

export interface AccountPanelProps
  extends React.HTMLAttributes<HTMLDivElement> {
  user: AccountInfo;
  onLogout?: () => void;
}

export const AccountPanel = React.forwardRef<HTMLDivElement, AccountPanelProps>(
  ({ user, onLogout, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-4 rounded-md border border-border-2 bg-surface-2 p-4", className)}
      {...props}
    >
      {user.avatar ? (
        <Image
          src={user.avatar}
          alt={user.name}
          width={48}
          height={48}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <p className="truncate font-medium">{user.name}</p>
        <p className="text-muted-foreground truncate text-sm">{user.email}</p>
      </div>
      {onLogout && (
        <Button variant="outline" onClick={onLogout} className="shrink-0">
          Log out
        </Button>
      )}
    </div>
  )
);
AccountPanel.displayName = "AccountPanel";
