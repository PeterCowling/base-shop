/* File: /src/hoc/withIconModal.tsx */
import { useRouter } from "next/navigation";

import { Button } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/primitives";
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
        maxWidth="max-w-md"
        footer={
          <Button color="default" tone="outline" onClick={onClose}>
            Close
          </Button>
        }
      >
        <Grid cols={2} gap={4}>
          {config.actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action.route)}
              disabled={!interactive}
              className={`flex flex-col items-center justify-center rounded border p-4 transition-colors ${
                interactive
                  ? "cursor-pointer hover:bg-surface-2"
                  : "opacity-50 cursor-not-allowed"
              }`}
            >
              <i className={`${action.iconClass} text-3xl mb-2`} />
              <span className="text-sm">{action.label}</span>
            </button>
          ))}
        </Grid>
      </SimpleModal>
    );
  };
}
