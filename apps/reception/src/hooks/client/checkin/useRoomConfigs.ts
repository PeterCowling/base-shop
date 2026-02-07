/* src/hooks/components/roomview/useRoomConfigs.ts */

import { useMemo } from "react";

/**
 * Provides static room configuration data (known rooms, bed counts, etc.).
 * Components or hooks can call these helpers directly.
 */
export default function useRoomConfigs() {
  const knownRooms = useMemo(
    () => ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
    []
  );

  function getBedCount(roomNumber: string): number {
    switch (roomNumber) {
      case "3":
      case "4":
        return 8;
      case "6":
        return 7;
      case "5":
      case "10":
      case "11":
      case "12":
        return 6;
      case "9":
        return 4;
      case "8":
        return 2;
      case "7":
        return 1;
      default:
        return 1;
    }
  }

  function getMaxGuestsPerBed(roomNumber: string): number {
    // Example usage
    return roomNumber === "7" ? 2 : 1;
  }

  return {
    knownRooms,
    getBedCount,
    getMaxGuestsPerBed,
  };
}
