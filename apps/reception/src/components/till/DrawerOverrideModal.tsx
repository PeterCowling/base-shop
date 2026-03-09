import type { DrawerOverride } from "../../types/component/Till";
import { getItalyIsoString } from "../../utils/dateUtils";

import ManagerAuthModal from "./ManagerAuthModal";

interface DrawerOverrideModalProps {
  shiftOwnerName: string;
  shiftOwnerUid?: string;
  onConfirm: (override: DrawerOverride) => void;
  onCancel: () => void;
}

export default function DrawerOverrideModal({
  shiftOwnerName,
  shiftOwnerUid,
  onConfirm,
  onCancel,
}: DrawerOverrideModalProps) {
  return (
    <ManagerAuthModal
      title="Manager Override Required"
      description={
        <>
          This shift was opened by{" "}
          <span className="font-semibold">{shiftOwnerName}</span>. A manager
          must authenticate to close it on their behalf.
        </>
      }
      notePlaceholder="Override reason"
      noteRequiredError="Override reason is required."
      selfConflictError="You cannot override your own shift."
      submitLabel="Override"
      successToast="Manager override recorded."
      shiftOwnerName={shiftOwnerName}
      shiftOwnerUid={shiftOwnerUid}
      testIdPrefix="drawer-override"
      noteSuffix="reason"
      onConfirm={(managerName, managerUid, note) =>
        onConfirm({
          overriddenBy: managerName,
          overriddenByUid: managerUid,
          overriddenAt: getItalyIsoString(),
          overrideReason: note,
        })
      }
      onCancel={onCancel}
    />
  );
}
