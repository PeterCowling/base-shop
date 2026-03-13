"use client";

import { memo, useCallback,useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
} from "lucide-react";

import { Button } from "@acme/design-system/atoms";
import { Cluster, Stack } from "@acme/design-system/primitives";

import { canAccess, isPrivileged } from "../../lib/roles";
import { isStaffAccountsPeteIdentity } from "../../lib/staffAccountsAccess";
import type { User } from "../../types/domains/userDomain";

import { type NavConfigItem, type NavSection,navSections } from "./navConfig";

interface AppNavProps {
  user: { user_name: string; email?: string; roles?: User["roles"]; uid?: string };
  onLogout: () => void;
}

function AppNav({ user, onLogout }: AppNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleNav = useCallback(() => setIsOpen((prev) => !prev), []);
  const closeNav = useCallback(() => setIsOpen(false), []);

  const navigateTo = useCallback(
    (route: string) => {
      router.push(route);
      closeNav();
    },
    [router, closeNav]
  );

  // Check if user can access a section or item
  const canAccessSection = useCallback(
    (permission?: NavSection["permission"]): boolean => {
      if (!permission) return true;
      // If user has roles array (new system), check roles
      if ("roles" in user && Array.isArray(user.roles)) {
        return canAccess(user as User, permission);
      }
      // Fallback for legacy users without roles: treat as privileged if owner/developer
      return isPrivileged(user as User);
    },
    [user]
  );

  return (
    <div className="relative">
      {/* Nav Toggle Button */}
      <Button
        onClick={toggleNav}
        color="primary"
        tone="solid"
        iconOnly
        className="fixed start-4 top-4 shadow-lg"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-surface/80 backdrop-blur-sm"
          onClick={closeNav}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Stack
        asChild
        className={`fixed start-0 top-0 h-full w-64 transform bg-surface shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav
          aria-label="Main navigation"
        >
        {/* Header */}
        <Cluster justify="between" className="border-b border-border p-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Reception
            </h2>
            <p className="text-sm text-muted-foreground">
              {user.user_name}
            </p>
          </div>
          <Button
            onClick={closeNav}
            color="default"
            tone="ghost"
            iconOnly
            aria-label="Close navigation"
          >
            <X size={20} />
          </Button>
        </Cluster>

        {/* Nav Sections */}
        <div className="flex-1 overflow-y-auto p-4">
          {navSections.map((section) => {
            if (!canAccessSection(section.permission)) return null;

            return (
              <div key={section.label} className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item: NavConfigItem) => {
                    if (!canAccessSection(item.permission)) return null;
                    if (
                      item.route === "/staff-accounts" &&
                      !isStaffAccountsPeteIdentity(user)
                    ) {
                      return null;
                    }

                    const isActive = pathname === item.route;

                    return (
                      <li key={item.route}>
                        <Button
                          onClick={() => navigateTo(item.route)}
                          color={isActive ? "primary" : "default"}
                          tone={isActive ? "soft" : "ghost"}
                          size="sm"
                          className="w-full gap-3 justify-start min-h-11"
                        >
                          <item.icon size={16} className="shrink-0" />
                          {item.label}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-border p-4">
          <Button
            onClick={onLogout}
            color="danger"
            tone="ghost"
            size="sm"
            className="w-full gap-3 justify-start min-h-11"
          >
            <LogOut size={16} className="shrink-0" />
            Sign out
          </Button>
        </div>
        </nav>
      </Stack>

      {/* Keyboard shortcut hint (only shown when nav is closed) */}
      {!isOpen && (
        <div className="fixed bottom-4 left-4 z-30 rounded-lg bg-surface/90 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
          <kbd className="rounded-lg bg-surface-3 px-1.5 py-0.5 font-mono">
            Arrow Up/Down
          </kbd>{" "}
          for modals
        </div>
      )}
    </div>
  );
}

export default memo(AppNav);
