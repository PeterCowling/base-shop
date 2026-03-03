"use client";

import { useRouter } from "next/navigation";

import { Button } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/primitives";
import { cn } from "@acme/design-system/utils/style";
import { SimpleModal } from "@acme/ui/molecules";

import { type ModalAction } from "../types/component/ModalAction";

interface WithIconModalConfig {
  label: string;
  actions: ModalAction[];
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

    const handleActionClick = (route: string) => {
      if (!interactive) return;
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
          {config.actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.route}
                onClick={() => handleActionClick(action.route)}
                disabled={!interactive}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 rounded-lg border bg-surface-2 p-5 transition-all duration-150 text-center",
                  interactive
                    ? "cursor-pointer border-border-2 text-primary-main hover:border-primary hover:bg-primary-soft active:scale-95"
                    : "cursor-not-allowed border-border-1 text-muted-foreground opacity-40"
                )}
              >
                <Icon size={26} className="shrink-0" />
                <span className="text-sm font-medium leading-tight text-foreground">{action.label}</span>
              </button>
            );
          })}
        </Grid>
      </SimpleModal>
    );
  };
}
