"use client";

import { useRouter } from "next/navigation";

import { Button } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/primitives";
import { cn } from "@acme/design-system/utils/style";
import { SimpleModal } from "@acme/ui/molecules";

import { useAuth } from "../context/AuthContext";
import { canAccess } from "../lib/roles";
import { isStaffAccountsPeteIdentity } from "../lib/staffAccountsAccess";
import { type ModalAction } from "../types/component/ModalAction";
import type { UserRole } from "../types/domains/userDomain";

interface WithIconModalConfig {
  label: string;
  actions: ModalAction[];
  /**
   * Optional section-level permission key for interactive gating.
   *
   * When provided, the HOC calls `canAccess(authUser, permissionKey)` internally
   * and uses the result as the effective `interactive` value.
   *
   * Precedence: when `permissionKey` is set, the computed value wins over any
   * `interactive` prop passed externally. This ensures TillModal and ManModal
   * always reflect the authenticated user's actual access level.
   *
   * When absent, `interactive` defaults to `true` (OperationsModal / ManagementModal
   * have no section-level gate and remain always interactive).
   */
  permissionKey?: UserRole[];
}

export interface IconModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: { email: string; user_name: string };
  interactive?: boolean;
}

export function withIconModal(config: WithIconModalConfig) {
  return function IconModal({ visible, onClose, interactive = true }: IconModalProps) {
    const router = useRouter();
    const { user: authUser } = useAuth();

    // When permissionKey is configured, derive interactive from the authenticated user's roles.
    // This eliminates the need for wrapper components in TillModal and ManModal.
    const effectiveInteractive = config.permissionKey
      ? canAccess(authUser, config.permissionKey)
      : interactive;

    const visibleActions = config.actions.filter((action) => {
      if (action.permission && !canAccess(authUser, action.permission)) {
        return false;
      }
      if (action.peteOnly && !isStaffAccountsPeteIdentity(authUser)) {
        return false;
      }
      return true;
    });

    const handleActionClick = (route: string) => {
      if (!effectiveInteractive) return;
      onClose();
      router.push(route);
    };

    return (
      <SimpleModal
        isOpen={visible}
        onClose={onClose}
        title={config.label}
        maxWidth="max-w-lg"
        backdropClassName="bg-surface/80 backdrop-blur-md"
        footer={
          <Button color="default" tone="outline" onClick={onClose}>
            Close
          </Button>
        }
      >
        <Grid cols={3} gap={3}>
          {visibleActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                compatibilityMode="passthrough"
                key={action.route}
                onClick={() => handleActionClick(action.route)}
                disabled={!effectiveInteractive}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-lg border bg-surface-2 p-5 transition-all duration-150 text-center",
                  effectiveInteractive
                    ? "cursor-pointer border-border-2 text-primary-main hover:border-primary hover:bg-primary-soft active:scale-95"
                    : "cursor-not-allowed border-border-1 text-muted-foreground opacity-40"
                )}
              >
                <Icon size={26} className="shrink-0" />
                <span className="text-sm font-medium leading-tight text-foreground">{action.label}</span>
              </Button>
            );
          })}
        </Grid>
      </SimpleModal>
    );
  };
}
