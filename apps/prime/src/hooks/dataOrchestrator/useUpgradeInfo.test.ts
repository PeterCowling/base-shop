import "@testing-library/jest-dom";
import { renderHook } from '@testing-library/react';
import { useUpgradeInfo } from './useUpgradeInfo';

// Mock roomUtils
jest.mock('../../utils/roomUtils', () => ({
  getRoomDetails: jest.fn((roomNum: string) => ({
    name: `Room ${roomNum}`,
    details: `Details for room ${roomNum}`,
  })),
}));

// Mock translation function
const mockT = jest.fn((key: string) => key);

describe('useUpgradeInfo', () => {
  describe('returns null when data is missing', () => {
    it('returns null when bookedRoom is missing', () => {
      const { result } = renderHook(() =>
        useUpgradeInfo({ allocatedRoom: '5', t: mockT })
      );

      expect(result.current).toBeNull();
    });

    it('returns null when allocatedRoom is missing', () => {
      const { result } = renderHook(() =>
        useUpgradeInfo({ bookedRoom: '3', t: mockT })
      );

      expect(result.current).toBeNull();
    });

    it('returns null when both are missing', () => {
      const { result } = renderHook(() => useUpgradeInfo({ t: mockT }));

      expect(result.current).toBeNull();
    });
  });

  describe('upgrade detection from rooms 3,4', () => {
    it.each([5, 6, 7, 8, 9, 11, 12])(
      'detects upgrade from room 3 to room %i',
      (allocatedRoom) => {
        const { result } = renderHook(() =>
          useUpgradeInfo({
            bookedRoom: '3',
            allocatedRoom: String(allocatedRoom),
            t: mockT,
          })
        );

        expect(result.current?.upgraded).toBe(true);
        expect(result.current?.messageKey).toBe('bookingInfo.upgradedTo');
      }
    );

    it.each([5, 6, 7, 8, 9, 11, 12])(
      'detects upgrade from room 4 to room %i',
      (allocatedRoom) => {
        const { result } = renderHook(() =>
          useUpgradeInfo({
            bookedRoom: '4',
            allocatedRoom: String(allocatedRoom),
            t: mockT,
          })
        );

        expect(result.current?.upgraded).toBe(true);
      }
    );
  });

  describe('upgrade detection from rooms 5,6', () => {
    it.each([7, 11, 12])(
      'detects upgrade from room 5 to room %i',
      (allocatedRoom) => {
        const { result } = renderHook(() =>
          useUpgradeInfo({
            bookedRoom: '5',
            allocatedRoom: String(allocatedRoom),
            t: mockT,
          })
        );

        expect(result.current?.upgraded).toBe(true);
      }
    );

    it.each([7, 11, 12])(
      'detects upgrade from room 6 to room %i',
      (allocatedRoom) => {
        const { result } = renderHook(() =>
          useUpgradeInfo({
            bookedRoom: '6',
            allocatedRoom: String(allocatedRoom),
            t: mockT,
          })
        );

        expect(result.current?.upgraded).toBe(true);
      }
    );
  });

  describe('upgrade detection from room 10', () => {
    it.each([9, 5, 6, 11, 12])(
      'detects upgrade from room 10 to room %i',
      (allocatedRoom) => {
        const { result } = renderHook(() =>
          useUpgradeInfo({
            bookedRoom: '10',
            allocatedRoom: String(allocatedRoom),
            t: mockT,
          })
        );

        expect(result.current?.upgraded).toBe(true);
      }
    );
  });

  describe('non-upgrade scenarios', () => {
    it('does not detect upgrade when same room', () => {
      const { result } = renderHook(() =>
        useUpgradeInfo({ bookedRoom: '5', allocatedRoom: '5', t: mockT })
      );

      expect(result.current?.upgraded).toBe(false);
      expect(result.current?.messageKey).toBe('bookingInfo.thisRoomType');
    });

    it('does not detect upgrade for unrelated room combinations', () => {
      const { result } = renderHook(() =>
        useUpgradeInfo({ bookedRoom: '7', allocatedRoom: '8', t: mockT })
      );

      expect(result.current?.upgraded).toBe(false);
    });

    it('does not detect upgrade when rooms are non-numeric', () => {
      const { result } = renderHook(() =>
        useUpgradeInfo({ bookedRoom: 'abc', allocatedRoom: 'xyz', t: mockT })
      );

      expect(result.current?.upgraded).toBe(false);
    });
  });

  describe('room details', () => {
    it('provides room names and details', () => {
      const { result } = renderHook(() =>
        useUpgradeInfo({ bookedRoom: '3', allocatedRoom: '5', t: mockT })
      );

      expect(result.current?.bookedRoomName).toBe('Room 3');
      expect(result.current?.bookedRoomDetails).toBe('Details for room 3');
      expect(result.current?.allocatedRoomName).toBe('Room 5');
      expect(result.current?.allocatedRoomDetails).toBe('Details for room 5');
    });
  });
});
