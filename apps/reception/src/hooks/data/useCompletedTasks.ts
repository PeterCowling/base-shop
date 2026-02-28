/* src/hooks/data/useCompletedTasks.ts */

import { useCallback } from "react";
import { ref, set } from "firebase/database";

import { useAuth } from "../../context/AuthContext";
import { queueOfflineWrite } from "../../lib/offline/syncManager";
import { useOnlineStatus } from "../../lib/offline/useOnlineStatus";
import { useFirebaseDatabase } from "../../services/useFirebase";
import {
  type CompletedTaskField,
  type CompletedTaskFlags,
} from "../../types/hooks/data/completedTasksData";

/**
 * This hook provides functions to write data to the "completedTasks" node
 * for tracking the completion status of various services/tasks for occupants.
 *
 * @returns An object containing methods to update completed tasks.
 */
export function useCompletedTasks() {
  const database = useFirebaseDatabase();
  const { user } = useAuth();
  const online = useOnlineStatus();

  /**
   * Sets the entire block of completed tasks for a specific occupant.
   * @param occupantId - The unique identifier for the occupant
   * @param tasks - An object of all completed task flags
   */
  const setOccupantTasks = useCallback(
    async (occupantId: string, tasks: CompletedTaskFlags): Promise<void> => {
      if (!user) {
        console.warn("No user is logged in; cannot set occupant tasks.");
        return;
      }

      if (!online) {
        const queued = await queueOfflineWrite(`completedTasks/${occupantId}`, "set", tasks, {
          idempotencyKey: crypto.randomUUID(),
          conflictPolicy: "last-write-wins",
          domain: "tasks",
        });
        if (queued !== null) return;
        // IDB unavailable — fall through to direct write
      }

      try {
        await set(ref(database, `completedTasks/${occupantId}`), tasks);
      } catch (error) {
        console.error("Error writing occupant tasks:", error);
      }
    },
    [database, online, user]
  );

  /**
   * Updates a single task field for a specific occupant.
   * @param occupantId - The unique identifier for the occupant
   * @param field - The task field to be updated
   * @param value - "true" or "false"
   */
  const updateSingleTask = useCallback(
    async (
      occupantId: string,
      field: CompletedTaskField,
      value: "true" | "false"
    ): Promise<void> => {
      if (!user) {
        console.warn("No user is logged in; cannot update occupant tasks.");
        return;
      }

      if (!online) {
        const queued = await queueOfflineWrite(`completedTasks/${occupantId}/${field}`, "set", value, {
          idempotencyKey: crypto.randomUUID(),
          conflictPolicy: "last-write-wins",
          domain: "tasks",
        });
        if (queued !== null) return;
        // IDB unavailable — fall through to direct write
      }

      try {
        await set(
          ref(database, `completedTasks/${occupantId}/${field}`),
          value
        );
      } catch (error) {
        console.error("Error writing occupant tasks:", error);
      }
    },
    [database, online, user]
  );

  return {
    setOccupantTasks,
    updateSingleTask,
  };
}
