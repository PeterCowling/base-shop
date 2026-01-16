import type { ModalName } from "../types/ModalName";
import ManagementModal from "./appNav/ManagementModal";
import ManModal from "./appNav/ManModal";
import OperationsModal from "./appNav/OperationsModal";
import TillModal from "./appNav/TillModal";

export interface AppModalsProps {
  user: { email: string; user_name: string };
  activeModal: ModalName | null;
  closeModal: () => void;
  handleLogout: () => void;
}

export default function AppModals({
  user,
  activeModal,
  closeModal,
  handleLogout,
}: AppModalsProps) {
  return (
    <>
      <OperationsModal
        visible={activeModal === "operations"}
        onClose={closeModal}
        onLogout={handleLogout}
        user={user}
      />
      <TillModal
        visible={activeModal === "till"}
        onClose={closeModal}
        onLogout={handleLogout}
        user={user}
      />
      <ManagementModal
        visible={activeModal === "management"}
        onClose={closeModal}
        onLogout={handleLogout}
        user={user}
      />
      <ManModal
        visible={activeModal === "man"}
        onClose={closeModal}
        onLogout={handleLogout}
        user={user}
      />
    </>
  );
}
