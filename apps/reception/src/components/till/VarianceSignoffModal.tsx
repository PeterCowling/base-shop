import type { VarianceSignoff } from "../../types/component/Till";
import { getItalyIsoString } from "../../utils/dateUtils";
import { formatEuro } from "../../utils/format";

import ManagerAuthModal from "./ManagerAuthModal";

interface VarianceSignoffModalProps {
  shiftOwnerName: string;
  shiftOwnerUid?: string;
  varianceAmount: number;
  onConfirm: (signoff: VarianceSignoff) => void;
  onCancel: () => void;
}

export default function VarianceSignoffModal({
  shiftOwnerName,
  shiftOwnerUid,
  varianceAmount,
  onConfirm,
  onCancel,
}: VarianceSignoffModalProps) {
  return (
    <ManagerAuthModal
      title="Manager Sign-off Required"
      description={`Variance detected: ${formatEuro(varianceAmount)}. A manager must sign off before closing this shift.`}
      notePlaceholder="Variance note"
      noteRequiredError="Variance note is required."
      selfConflictError="A different manager must sign off on this variance."
      submitLabel="Sign off"
      successToast="Variance sign-off recorded."
      shiftOwnerName={shiftOwnerName}
      shiftOwnerUid={shiftOwnerUid}
      onConfirm={(managerName, managerUid, note) =>
        onConfirm({
          signedOffBy: managerName,
          signedOffByUid: managerUid,
          signedOffAt: getItalyIsoString(),
          varianceNote: note,
        })
      }
      onCancel={onCancel}
    />
  );
}
