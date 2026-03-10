import { memo, type ReactNode } from "react";

import type { ModalName } from "../types/ModalName";

import AppModals from "./AppModals";

export interface AuthenticatedAppProps {
  user: { email: string; user_name: string };
  activeModal: ModalName | null;
  closeModal: () => void;
  handleLogout: () => void;
  children: ReactNode;
}

/**
 * AuthenticatedApp — application chrome only.
 *
 * Provides: max-width container, lateral borders, outer shadow.
 * Does NOT provide: gradient (owned by OperationalTableScreen), padding (owned by each screen).
 *
 * Gradient and padding were removed in TASK-02 (reception-theme-styling-cohesion).
 * OperationalTableScreen is the single source of gradient for table-workflow routes.
 * POSFullBleedScreen (Bar) has its own full-bleed layout and does not rely on this wrapper for styling.
 */
const AuthenticatedApp = memo(function AuthenticatedApp({
  user,
  activeModal,
  closeModal,
  handleLogout,
  children,
}: AuthenticatedAppProps) {
  return (
    <div className="min-h-screen">
      <div className="w-full max-w-6xl mx-auto border-l border-r border-border-1/50 shadow-xl">
        {children}
      </div>
      <AppModals
        user={user}
        activeModal={activeModal}
        closeModal={closeModal}
        handleLogout={handleLogout}
      />
    </div>
  );
});

export default AuthenticatedApp;
