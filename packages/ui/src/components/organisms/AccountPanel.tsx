"use client";
import Image from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
import { useTranslations } from "@acme/i18n";
import { Cover } from "../atoms/primitives";

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
  ({ user, onLogout, className, ...props }, ref) => {
    const t = useTranslations();
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-4 rounded-md border border-border-2 bg-surface-2 p-4", // i18n-exempt: class names
          className
        )}
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
          <Cover
            className="size-12 rounded-full bg-muted text-muted-foreground"
            center={user.name.charAt(0).toUpperCase()}
          />
        )}
        <div className="flex-1 overflow-hidden">
          <p className="truncate font-medium">{user.name}</p>
          <p className="text-muted-foreground truncate text-sm">{user.email}</p>
        </div>
        {onLogout && (
          <Button variant="outline" onClick={onLogout} className="shrink-0">
            {t("Log out")}
          </Button>
        )}
      </div>
    );
  }
);
AccountPanel.displayName = "AccountPanel";
