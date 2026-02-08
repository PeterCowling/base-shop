import { useCallback, useMemo } from "react";
import {
  equalTo,
  get,
  orderByChild,
  push,
  query,
  ref,
  set,
  update,
} from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { keycardAssignmentSchema } from "../../schemas/keycardAssignmentSchema";
import { useFirebaseDatabase } from "../../services/useFirebase";
import type { KeycardAssignmentStatus } from "../../types/hooks/data/keycardAssignmentData";
import { getItalyIsoString } from "../../utils/dateUtils";
import { getErrorMessage } from "../../utils/errorMessage";
import { getStoredShiftId } from "../../utils/shiftId";
import { showToast } from "../../utils/toastUtils";

interface AssignGuestKeycardParams {
  keycardNumber: string;
  occupantId: string;
  bookingRef: string;
  roomNumber: string;
  depositMethod: string;
  depositAmount: number;
  loanTxnId?: string;
}

interface AssignMasterKeyParams {
  keycardNumber: string;
  staffUserName: string;
}

async function hasActiveAssignment(
  database: ReturnType<typeof useFirebaseDatabase>,
  keycardNumber: string
): Promise<boolean> {
  const q = query(
    ref(database, "keycardAssignments"),
    orderByChild("keycardNumber"),
    equalTo(keycardNumber)
  );
  const snap = await get(q);
  if (!snap.exists()) return false;
  const entries = snap.val() as Record<string, { status: KeycardAssignmentStatus }>;
  return Object.values(entries).some((e) => e.status === "issued");
}

export function useKeycardAssignmentsMutations() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();

  const assignGuestKeycard = useCallback(
    async (params: AssignGuestKeycardParams): Promise<string | undefined> => {
      if (!user) {
        showToast("No user logged in", "error");
        return;
      }

      const duplicate = await hasActiveAssignment(database, params.keycardNumber);
      if (duplicate) {
        showToast(
          `Keycard ${params.keycardNumber} is already assigned to a guest`,
          "error"
        );
        return;
      }

      const entry = {
        keycardNumber: params.keycardNumber,
        isMasterKey: false,
        occupantId: params.occupantId,
        bookingRef: params.bookingRef,
        roomNumber: params.roomNumber,
        depositMethod: params.depositMethod,
        depositAmount: params.depositAmount,
        assignedAt: getItalyIsoString(),
        assignedBy: user.user_name,
        status: "issued" as const,
        ...(params.loanTxnId ? { loanTxnId: params.loanTxnId } : {}),
        ...(getStoredShiftId() ? { shiftId: getStoredShiftId()! } : {}),
      };

      const result = keycardAssignmentSchema.safeParse(entry);
      if (!result.success) {
        showToast(getErrorMessage(result.error), "error");
        return;
      }

      try {
        const newRef = push(ref(database, "keycardAssignments"));
        await set(newRef, result.data);
        return newRef.key ?? undefined;
      } catch {
        showToast("Failed to save keycard assignment", "error");
      }
    },
    [database, user]
  );

  const assignMasterKey = useCallback(
    async (params: AssignMasterKeyParams): Promise<string | undefined> => {
      if (!user) {
        showToast("No user logged in", "error");
        return;
      }

      const duplicate = await hasActiveAssignment(database, params.keycardNumber);
      if (duplicate) {
        showToast(
          `Master key ${params.keycardNumber} is already assigned`,
          "error"
        );
        return;
      }

      const entry = {
        keycardNumber: params.keycardNumber,
        isMasterKey: true,
        assignedToStaff: params.staffUserName,
        assignedAt: getItalyIsoString(),
        assignedBy: user.user_name,
        status: "issued" as const,
        ...(getStoredShiftId() ? { shiftId: getStoredShiftId()! } : {}),
      };

      const result = keycardAssignmentSchema.safeParse(entry);
      if (!result.success) {
        showToast(getErrorMessage(result.error), "error");
        return;
      }

      try {
        const newRef = push(ref(database, "keycardAssignments"));
        await set(newRef, result.data);
        return newRef.key ?? undefined;
      } catch {
        showToast("Failed to save master key assignment", "error");
      }
    },
    [database, user]
  );

  const returnKeycard = useCallback(
    async (assignmentId: string): Promise<void> => {
      if (!user) {
        showToast("No user logged in", "error");
        return;
      }

      try {
        await update(ref(database, `keycardAssignments/${assignmentId}`), {
          returnedAt: getItalyIsoString(),
          returnedBy: user.user_name,
          status: "returned",
        });
      } catch {
        showToast("Failed to update keycard assignment", "error");
      }
    },
    [database, user]
  );

  const markLost = useCallback(
    async (
      assignmentId: string,
      replacementAssignmentId?: string
    ): Promise<void> => {
      if (!user) {
        showToast("No user logged in", "error");
        return;
      }

      try {
        const updates: Record<string, string> = {
          status: "lost",
        };
        if (replacementAssignmentId) {
          updates.replacedByAssignmentId = replacementAssignmentId;
        }
        await update(
          ref(database, `keycardAssignments/${assignmentId}`),
          updates
        );
      } catch {
        showToast("Failed to update keycard assignment", "error");
      }
    },
    [database, user]
  );

  return useMemo(
    () => ({ assignGuestKeycard, assignMasterKey, returnKeycard, markLost }),
    [assignGuestKeycard, assignMasterKey, returnKeycard, markLost]
  );
}
