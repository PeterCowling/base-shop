/**
 * useUpgradeInfo
 *
 * Detects room upgrades and provides upgrade information for display.
 */

import { useMemo } from 'react';
import { TFunction } from 'i18next';
import { getRoomDetails } from '../../utils/roomUtils';

export interface UpgradeInfo {
  upgraded: boolean;
  messageKey: string;
  allocatedRoomName: string;
  allocatedRoomDetails: string;
  bookedRoomName: string;
  bookedRoomDetails: string;
}

export interface UseUpgradeInfoInput {
  bookedRoom?: string;
  allocatedRoom?: string;
  t: TFunction;
}

/**
 * Check if the guest was upgraded based on room numbers.
 * Business logic: certain room combinations indicate an upgrade.
 */
function checkIfUpgraded(bookedRoom: string, allocatedRoom: string): boolean {
  const booked = parseInt(bookedRoom, 10);
  const allocated = parseInt(allocatedRoom, 10);

  if (Number.isNaN(booked) || Number.isNaN(allocated)) return false;

  // Room upgrade rules:
  // Rooms 3,4 -> 5,6,7,8,9,11,12 = upgrade
  if ([3, 4].includes(booked) && [5, 6, 7, 8, 9, 11, 12].includes(allocated)) {
    return true;
  }
  // Rooms 5,6 -> 7,11,12 = upgrade
  if ([5, 6].includes(booked) && [7, 11, 12].includes(allocated)) {
    return true;
  }
  // Room 10 -> 9,5,6,11,12 = upgrade
  if (booked === 10 && [9, 5, 6, 11, 12].includes(allocated)) {
    return true;
  }

  return false;
}

export function useUpgradeInfo(input: UseUpgradeInfoInput): UpgradeInfo | null {
  const { bookedRoom, allocatedRoom, t } = input;

  return useMemo(() => {
    if (!bookedRoom || !allocatedRoom) return null;

    const wasUpgraded = checkIfUpgraded(bookedRoom, allocatedRoom);
    const allocatedInfo = getRoomDetails(allocatedRoom, t);
    const bookedInfo = getRoomDetails(bookedRoom, t);

    return {
      upgraded: wasUpgraded,
      messageKey: wasUpgraded
        ? 'bookingInfo.upgradedTo'
        : 'bookingInfo.thisRoomType',
      allocatedRoomName: allocatedInfo.name,
      allocatedRoomDetails: allocatedInfo.details,
      bookedRoomName: bookedInfo.name,
      bookedRoomDetails: bookedInfo.details,
    };
  }, [bookedRoom, allocatedRoom, t]);
}
