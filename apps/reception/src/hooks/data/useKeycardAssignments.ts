import { useMemo } from "react";

import { keycardAssignmentsSchema } from "../../schemas/keycardAssignmentSchema";
import type { KeycardAssignment } from "../../types/hooks/data/keycardAssignmentData";

import useFirebaseSubscription from "./useFirebaseSubscription";

export function useKeycardAssignments() {
  const { data, loading, error } = useFirebaseSubscription<
    Record<string, KeycardAssignment>
  >("keycardAssignments", keycardAssignmentsSchema);

  const assignments = useMemo<KeycardAssignment[]>(
    () => (data ? Object.values(data) : []),
    [data]
  );

  const assignmentsRecord = useMemo<Record<string, KeycardAssignment>>(
    () => data ?? {},
    [data]
  );

  const activeAssignments = useMemo(
    () => assignments.filter((a) => a.status === "issued"),
    [assignments]
  );

  return useMemo(
    () => ({ assignments, assignmentsRecord, activeAssignments, loading, error }),
    [assignments, assignmentsRecord, activeAssignments, loading, error]
  );
}
