// File: src/hooks/mutations/useAllocateRoom.ts

import { useCallback, useState } from "react";

import useActivitiesMutations from "./useActivitiesMutations";
import useGuestByRoomMutations from "./useGuestByRoomMutations";
import useRoomsByDateMutations from "./useRoomsByDateMutations";
import { useAuth } from "../../context/AuthContext";
import type { SaveRoomsByDateParams } from "../../types/hooks/mutations/saveRoomsByDateParams";
import { showToast } from "../../utils/toastUtils";

/**
 * Params for allocateRoomIfAllowed.
 * Bundles occupant data plus the old/new /roomsByDate details.
 */
interface AllocateRoomParams extends SaveRoomsByDateParams {
  occupantId: string;
  newRoomValue: string;
}

/**
 * Determines if a room change is an upgrade.
 *
 * The expected format for room strings is "index_<number>".
 *
 * @param oldRoom - The original room string (e.g., "index_3"), or null.
 * @param newRoom - The new room string (e.g., "index_5"), or null.
 * @returns true if the change qualifies as an upgrade.
 */
export function isUpgrade(
  oldRoom: string | null,
  newRoom: string | null
): boolean {
  // If either value is null, treat as no upgrade.
  if (!oldRoom || !newRoom) return false;

  // Remove the "index_" prefix if present.
  const oldNum = oldRoom.startsWith("index_")
    ? oldRoom.replace("index_", "")
    : oldRoom;
  const newNum = newRoom.startsWith("index_")
    ? newRoom.replace("index_", "")
    : newRoom;

  if (
    (oldNum === "3" || oldNum === "4") &&
    ["5", "6", "7", "8", "9", "10", "11", "12"].includes(newNum)
  ) {
    return true;
  }
  if (
    (oldNum === "5" || oldNum === "6") &&
    ["7", "11", "12"].includes(newNum)
  ) {
    return true;
  }
  if (oldNum === "10" && ["9", "11", "7", "12"].includes(newNum)) {
    return true;
  }
  return false;
}

/**
 * Hook: Allows "pete" or "serena" to change a guest's allocated room,
 * update the /roomsByDate node to reflect the new assignment,
 * and log an activity in two locations.
 *
 * After a successful update:
 *  - If the change is an upgrade, log activity with code 17.
 *  - Otherwise, log activity with code 18.
 *
 * Returns a function `allocateRoomIfAllowed` that:
 *   1) Updates the occupant's "allocated" room in /guestByRoom.
 *   2) Moves the occupant in the /roomsByDate node.
 *   3) Logs an activity based on the upgrade rules.
 */
export default function useAllocateRoom() {
  const { user } = useAuth();
  const { saveGuestByRoom } = useGuestByRoomMutations();
  const { saveRoomsByDate } = useRoomsByDateMutations();
  const { logActivity } = useActivitiesMutations();
  const [error, setError] = useState<unknown>(null);

  const allocateRoomIfAllowed = useCallback(
    async (params: AllocateRoomParams): Promise<string> => {
      const {
        occupantId,
        newRoomValue,
        oldDate,
        oldRoom,
        oldBookingRef,
        oldGuestId,
        newDate,
        newRoom,
        newBookingRef,
        newGuestId,
      } = params;

      // Check user existence and permission.
      if (!user) {
        showToast("No user found, cannot update occupant room.", "error");
        throw new Error("No user found");
      }
      const allowedUsernames = ["pete", "serena"];
      const lowerName = (user.user_name || "").toLowerCase();
      if (!allowedUsernames.includes(lowerName)) {
        showToast(
          "You do not have permission to update this occupant's room.",
          "info"
        );
        return "";
      }

      try {
        // 1. Update the occupant's allocated room in /guestByRoom.
        const updatedRecord = await saveGuestByRoom(occupantId, {
          allocated: newRoomValue,
        });
        // 2. Update the occupant's assignment in /roomsByDate.
        await saveRoomsByDate({
          oldDate,
          oldRoom,
          oldBookingRef,
          oldGuestId,
          newDate,
          newRoom,
          newBookingRef,
          newGuestId,
        });
        // 3. Determine if this change is an upgrade and log the appropriate activity.
        const upgrade = isUpgrade(oldRoom, newRoom);
        const activityCode = upgrade ? 17 : 18;
        await logActivity(occupantId, activityCode);

        return updatedRecord.allocated || "";
      } catch (err) {
        setError(err);
        showToast(`Error updating occupant: ${String(err)}`, "error");
        throw err;
      }
    },
    [user, saveGuestByRoom, saveRoomsByDate, logActivity]
  );

  return { allocateRoomIfAllowed, error };
}
