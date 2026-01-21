import { memo, type ReactNode } from "react";

import type { ModalName } from "../types/ModalName";
import AppModals from "./AppModals";
import DarkModeToggle from "./common/DarkModeToggle";

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
    <div className="min-h-screen bg-gray-100 dark:bg-darkBg">
      <div className="w-full max-w-6xl mx-auto border-l-4 border-r-4 border-indigo-300 shadow-lg">
        <div className="p-6">
          <nav className="mb-4 flex justify-end">
            <DarkModeToggle />
          </nav>
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
