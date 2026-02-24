/* File: /src/hoc/withIconModal.tsx */
import { useRouter } from "next/navigation";

import { Grid } from "@acme/design-system/primitives";

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

    if (!visible) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50">
        <div className="max-w-md w-full rounded-lg bg-surface p-6 dark:bg-darkSurface">
          <h2 className="mb-4 text-2xl font-bold dark:text-darkAccentGreen">{config.label}</h2>
          <Grid cols={2} gap={4}>
            {config.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action.route)}
                disabled={!interactive}
                className={`flex flex-col items-center justify-center rounded border p-4 transition-colors dark:text-darkAccentGreen ${
                  interactive
                    ? "cursor-pointer hover:bg-surface-2 dark:hover:bg-darkBorder"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <i className={`${action.iconClass} text-3xl mb-2`} />
                <span className="text-sm">{action.label}</span>
              </button>
            ))}
          </Grid>
          <button
            onClick={onClose}
            className="mt-4 w-full rounded bg-surface-3 px-4 py-2 transition-colors hover:bg-surface-2 dark:bg-darkBorder dark:text-darkAccentGreen dark:hover:bg-darkSurface"
          >
            Close
          </button>
        </div>
      </div>
    );
  };
}
