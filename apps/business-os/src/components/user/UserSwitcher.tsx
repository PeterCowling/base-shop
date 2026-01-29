/**
 * UserSwitcher Component
 * BOS-P2-01: User switcher for dev/testing
 *
 * Phase 0: Hidden in production (dev/testing only)
 * Phase 3+: Replace with full authentication
 */

"use client";

import { useState } from "react";
import Cookies from "js-cookie";

import type { User } from "@/lib/current-user";
import { USERS } from "@/lib/current-user";

export interface UserSwitcherProps {
  currentUser: User;
}

export function UserSwitcher({ currentUser }: UserSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Hide in production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const handleUserSwitch = (userId: string) => {
    // Don't reload if selecting current user
    if (userId === currentUser.id) {
      setIsOpen(false);
      return;
    }

    // Set cookie for user preference (expires in 30 days)
    Cookies.set("current_user_id", userId, { expires: 30 });

    // Reload page to apply new user
    window.location.reload();
  };

  return (
    <div className="relative">
      {/* Current User Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {currentUser.name[0]}
        </span>
        <span>{currentUser.name}</span>
        {currentUser.role === "admin" && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            Admin
          </span>
        )}
        <svg
          className="h-4 w-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md border border-border bg-background shadow-lg">
          <div
            role="listbox"
            aria-label="Select user"
            className="py-1"
          >
            {Object.values(USERS).map((user) => (
              <button
                key={user.id}
                type="button"
                role="option"
                aria-selected={user.id === currentUser.id}
                onClick={() => handleUserSwitch(user.id)}
                className={`flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted ${
                  user.id === currentUser.id
                    ? "bg-muted font-medium"
                    : "font-normal"
                }`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {user.name[0]}
                </span>
                <span className="flex-1 text-left">{user.name}</span>
                {user.role === "admin" && (
                  <span className="text-xs text-muted-foreground">Admin</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
