import type { KeycardTransfer } from "../../../types/hooks/data/keycardTransferData";
import { sameItalyDate } from "../../../utils/dateUtils";

export interface KeycardTransferResult {
  todaysTransfersToSafe: KeycardTransfer[];
  todaysTransfersFromSafe: KeycardTransfer[];
  keycardTransfersToSafeTotal: number;
  keycardTransfersFromSafeTotal: number;
}

export function calculateKeycardTransfers(
  transfers: KeycardTransfer[],
  targetDateStr: string
): KeycardTransferResult {
  const todaysTransfers = transfers.filter((t) =>
    sameItalyDate(t.timestamp, targetDateStr)
  );
  const todaysTransfersToSafe = todaysTransfers.filter(
    (t) => t.direction === "toSafe"
  );
  const todaysTransfersFromSafe = todaysTransfers.filter(
    (t) => t.direction === "fromSafe"
  );
  const keycardTransfersToSafeTotal = todaysTransfersToSafe.reduce(
    (sum, t) => sum + t.count,
    0
  );
  const keycardTransfersFromSafeTotal = todaysTransfersFromSafe.reduce(
    (sum, t) => sum + t.count,
    0
  );
  return {
    todaysTransfersToSafe,
    todaysTransfersFromSafe,
    keycardTransfersToSafeTotal,
    keycardTransfersFromSafeTotal,
  };
}

export default calculateKeycardTransfers;
