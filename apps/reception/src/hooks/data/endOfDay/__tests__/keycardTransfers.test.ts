import { describe, expect, it } from "vitest";
import type { KeycardTransfer } from "../../../../types/hooks/data/keycardTransferData";
import { calculateKeycardTransfers } from "../keycardTransfers";

describe("calculateKeycardTransfers", () => {
  it("filters transfers by date and direction", () => {
    const transfers: KeycardTransfer[] = [
      {
        user: "u",
        timestamp: "2024-01-01T10:00:00Z",
        count: 5,
        direction: "toSafe",
      },
      {
        user: "u",
        timestamp: "2024-01-01T11:00:00Z",
        count: 2,
        direction: "fromSafe",
      },
      {
        user: "u",
        timestamp: "2024-01-02T10:00:00Z",
        count: 7,
        direction: "toSafe",
      },
    ];

    const result = calculateKeycardTransfers(transfers, "2024-01-01");

    expect(result.todaysTransfersToSafe).toHaveLength(1);
    expect(result.keycardTransfersToSafeTotal).toBe(5);
    expect(result.todaysTransfersFromSafe).toHaveLength(1);
    expect(result.keycardTransfersFromSafeTotal).toBe(2);
  });
});
