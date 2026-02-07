import Swal from "sweetalert2";

import { showToast } from "./toastUtils";

/**
 * Interface for our confirmAndAllocateRoom "options" object
 */
export interface ConfirmAllocateOptions {
  occupantId: string;
  oldRoomValue: string;
  newRoomValue: string;
  onConfirm: () => Promise<string>;
  onSuccess?: (dbAllocatedRoom: string) => void;
  onCancel?: () => void;
  onDismiss?: () => void;
  occupantCount?: number;
  onConfirmAll?: () => Promise<void>;
}

/**
 * Manages the SweetAlert logic: compare old/new values, show if different,
 * handle confirmation, cancel, or dismiss.
 */
export function confirmAndAllocateRoom(options: ConfirmAllocateOptions) {
  const {
    occupantId,
    oldRoomValue,
    newRoomValue,
    onConfirm,
    onSuccess,
    onCancel,
    onDismiss,
    occupantCount,
    onConfirmAll,
  } = options;

  // 1) If the typed value didn't actually change, do nothing.
  if (newRoomValue.trim() === oldRoomValue.trim()) {
    return;
  }

  const multiple = Boolean(occupantCount && occupantCount > 1 && onConfirmAll);

  // 2) Show a confirmation SweetAlert if there's a real change
  return Swal.fire({
    title: "Confirm Room Change",
    text: multiple
      ? `Move all ${occupantCount} guests in this booking or just this guest to room "${newRoomValue}"?`
      : `Do you want to update occupant ${occupantId} to room "${newRoomValue}"?`,
    icon: "question",
    showCancelButton: true,
    showDenyButton: multiple,
    confirmButtonText: multiple ? "Just this guest" : "Yes, update",
    denyButtonText: multiple ? `All ${occupantCount}` : undefined,
    cancelButtonText: "Cancel",
    allowEnterKey: false, // force explicit user click
  })
    .then((result) => {
      if (result.isConfirmed) {
        // The user clicked "Yes, update"
        onConfirm()
          .then((dbAllocatedValue) => {
            if (dbAllocatedValue.trim() === oldRoomValue.trim()) {
              showToast("Room number not changed. No update required.", "info");
            } else {
              showToast(
                `Room successfully updated to ${dbAllocatedValue}.`,
                "success"
              );
            }
            if (onSuccess) {
              onSuccess(dbAllocatedValue);
            }
          })
          .catch(() => {
            showToast(
              "Failed to update room number. Please try again.",
              "error"
            );
          });
      } else if (result.isDenied && multiple) {
        onConfirmAll?.()
          .then(() => {
            showToast(
              `All guests successfully moved to ${newRoomValue}.`,
              "success"
            );
            if (onSuccess) {
              onSuccess(newRoomValue);
            }
          })
          .catch(() => {
            showToast(
              "Failed to update all guests. Please try again.",
              "error"
            );
          });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        showToast("Cancelling room update.", "info");
        if (onCancel) {
          onCancel();
        }
      } else {
        if (onDismiss) {
          onDismiss();
        }
      }
    })
    .catch(() => {
      showToast("Confirmation dialog error. Please try again.", "error");
    });
}
