/* File: /src/hoc/withIconModal.tsx */
import { useRouter } from "next/navigation";

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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-darkSurface rounded-lg p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">{config.label}</h2>
          <div className="grid grid-cols-2 gap-4">
            {config.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action.route)}
                disabled={!interactive}
                className={`flex flex-col items-center justify-center p-4 border rounded transition-colors dark:text-white ${
                  interactive
                    ? "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <i className={`${action.iconClass} text-3xl mb-2`} />
                <span className="text-sm">{action.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors dark:text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  };
}
