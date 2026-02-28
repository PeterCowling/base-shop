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

const AuthenticatedApp = memo(function AuthenticatedApp({
  user,
  activeModal,
  closeModal,
  handleLogout,
  children,
}: AuthenticatedAppProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-2 to-surface-3">
      <div className="w-full max-w-6xl mx-auto border-l border-r border-border-1/50 shadow-xl">
        <div className="p-6">
          {children}
        </div>
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
