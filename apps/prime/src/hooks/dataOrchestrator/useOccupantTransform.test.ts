import '@testing-library/jest-dom';

import { renderHook } from '@testing-library/react';

import type { UseOccupantTransformInput } from './useOccupantTransform';
import { useOccupantTransform } from './useOccupantTransform';

jest.mock('@/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../utils/dateUtils', () => ({
  parseCheckInDate: jest.fn((date: string) => new Date(date)),
  formatToYYYYMMDD: jest.fn((date: Date) => date.toISOString().split('T')[0]),
  getDaysBetween: jest.fn((from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  }),
}));

const baseBooking = {
  reservationCode: 'RES-001',
  checkInDate: '2025-09-01',
  checkOutDate: '2025-09-03',
  leadGuest: true as const,
  roomNumbers: ['5'],
};

const emptyInput: UseOccupantTransformInput = {
  bookingsData: null,
  loansData: null,
  guestDetailsData: null,
  guestRoomData: null,
  financialsData: null,
  preordersData: null,
  occupantTasks: undefined,
  cityTaxData: null,
  bagStorageData: null,
};

describe('useOccupantTransform', () => {
  describe('null cases', () => {
    it('returns null occupantData and null key when both inputs are null', () => {
      const { result } = renderHook(() => useOccupantTransform(emptyInput));
      expect(result.current.occupantData).toBeNull();
      expect(result.current.occupantRoomIdKey).toBeNull();
    });

    it('returns data when only bookingsData is provided', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({ ...emptyInput, bookingsData: baseBooking }),
      );
      expect(result.current.occupantData).not.toBeNull();
      expect(result.current.occupantData?.reservationCode).toBe('RES-001');
    });

    it('returns data when only guestDetailsData is provided', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          guestDetailsData: {
            firstName: 'Jane',
            lastName: 'Doe',
            citizenship: 'IT',
            dateOfBirth: { dd: '01', mm: '01', yyyy: '1990' },
            document: { number: 'AB123', type: 'Passport' },
            email: 'jane@example.com',
            gender: 'F',
            language: 'it',
            municipality: 'Rome',
            placeOfBirth: 'Rome',
          },
        }),
      );
      expect(result.current.occupantData).not.toBeNull();
      expect(result.current.occupantData?.firstName).toBe('Jane');
    });
  });

  describe('occupantRoomIdKey', () => {
    it('returns null when guestRoomData is null', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({ ...emptyInput, bookingsData: baseBooking }),
      );
      expect(result.current.occupantRoomIdKey).toBeNull();
    });

    it('returns the first key of guestRoomData', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          guestRoomData: { 'occ_ABC': { allocated: '5', booked: '3' } },
        }),
      );
      expect(result.current.occupantRoomIdKey).toBe('occ_ABC');
    });

    it('returns null when guestRoomData is empty object', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          guestRoomData: {},
        }),
      );
      expect(result.current.occupantRoomIdKey).toBeNull();
    });
  });

  describe('guest details mapping', () => {
    it('maps all guestDetailsData fields', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          guestDetailsData: {
            firstName: 'John',
            lastName: 'Smith',
            citizenship: 'GB',
            dateOfBirth: { dd: '15', mm: '06', yyyy: '1985' },
            document: { number: 'P12345', type: 'Passport' },
            email: 'john@example.com',
            gender: 'M',
            language: 'en',
            municipality: 'London',
            placeOfBirth: 'London',
          },
        }),
      );
      const data = result.current.occupantData!;
      expect(data.firstName).toBe('John');
      expect(data.lastName).toBe('Smith');
      expect(data.citizenship).toBe('GB');
      expect(data.email).toBe('john@example.com');
      expect(data.gender).toBe('M');
      expect(data.language).toBe('en');
    });

    it('defaults firstName and lastName to empty string when guestDetailsData is null', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({ ...emptyInput, bookingsData: baseBooking }),
      );
      expect(result.current.occupantData?.firstName).toBe('');
      expect(result.current.occupantData?.lastName).toBe('');
    });
  });

  describe('nights computation', () => {
    it('computes 2 nights for sep 01→03', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({ ...emptyInput, bookingsData: baseBooking }),
      );
      expect(result.current.occupantData?.nights).toBe(2);
    });

    it('returns undefined nights when checkInDate is missing', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: { reservationCode: 'RES-001', checkOutDate: '2025-09-03', leadGuest: true, roomNumbers: ['5'] } as typeof baseBooking,
        }),
      );
      expect(result.current.occupantData?.nights).toBeUndefined();
    });
  });

  describe('paymentTerms derivation', () => {
    it('returns true when any transaction has nonRefundable: true', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          financialsData: {
            balance: 0,
            totalDue: 300,
            totalPaid: 300,
            transactions: {
              'tx-1': { nonRefundable: false, amount: 100, timestamp: '', type: 'charge' },
              'tx-2': { nonRefundable: true, amount: 200, timestamp: '', type: 'charge' },
            },
          },
        }),
      );
      expect(result.current.occupantData?.paymentTerms).toBe(true);
    });

    it('returns false when no transactions are nonRefundable', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          financialsData: {
            balance: 0,
            totalDue: 100,
            totalPaid: 100,
            transactions: {
              'tx-1': { nonRefundable: false, amount: 100, timestamp: '', type: 'charge' },
            },
          },
        }),
      );
      expect(result.current.occupantData?.paymentTerms).toBe(false);
    });

    it('returns undefined when financialsData is null', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({ ...emptyInput, bookingsData: baseBooking }),
      );
      expect(result.current.occupantData?.paymentTerms).toBeUndefined();
    });
  });

  describe('bagStorage defaults', () => {
    it('defaults to {optedIn: false} when bagStorageData is null', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({ ...emptyInput, bookingsData: baseBooking }),
      );
      expect(result.current.occupantData?.bagStorage).toEqual({ optedIn: false });
    });

    it('passes through provided bagStorageData', () => {
      const bagStorage = { optedIn: true, requestStatus: 'confirmed' };
      const { result } = renderHook(() =>
        useOccupantTransform({ ...emptyInput, bookingsData: baseBooking, bagStorageData: bagStorage }),
      );
      expect(result.current.occupantData?.bagStorage).toEqual(bagStorage);
    });
  });

  describe('city tax lookup', () => {
    it('returns null cityTax when guestRoomData is null (no key to look up)', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          cityTaxData: { 'occ_ABC': { taxRate: 5 } as never },
        }),
      );
      expect(result.current.occupantData?.cityTax).toBeNull();
    });

    it('returns occupant-specific cityTax matched by occupantRoomIdKey', () => {
      const taxRecord = { taxRate: 5 };
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          guestRoomData: { 'occ_ABC': { allocated: '5', booked: '3' } },
          cityTaxData: { 'occ_ABC': taxRecord as never },
        }),
      );
      expect(result.current.occupantData?.cityTax).toEqual(taxRecord);
    });

    it('returns null when occupantRoomIdKey is not in cityTaxData', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          guestRoomData: { 'occ_ABC': { allocated: '5', booked: '3' } },
          cityTaxData: { 'occ_DIFFERENT': { taxRate: 5 } as never },
        }),
      );
      expect(result.current.occupantData?.cityTax).toBeNull();
    });
  });

  describe('room allocation', () => {
    it('maps allocated and booked room from guestRoomData', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: { ...baseBooking, roomNumbers: ['3'] },
          guestRoomData: { 'occ_XYZ': { allocated: '5', booked: '3' } },
        }),
      );
      expect(result.current.occupantData?.allocatedRoom).toBe('5');
      expect(result.current.occupantData?.bookedRoom).toBe('3');
    });
  });

  describe('processPreorders — array format', () => {
    it('returns empty array when preordersData is null', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({ ...emptyInput, bookingsData: baseBooking }),
      );
      expect(result.current.occupantData?.preorders).toEqual([]);
    });

    it('processes array preorders with valid Night keys', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          guestRoomData: { 'occ_ABC': { allocated: '5', booked: '3' } },
          preordersData: [
            { id: 'night1', night: 'Night1', breakfast: 'PREPAID_MP_A', drink1: 'COFFEE', drink2: 'NA' },
          ],
        }),
      );
      expect(result.current.occupantData?.preorders).toHaveLength(1);
      expect(result.current.occupantData?.preorders[0].night).toBe('Night1');
      expect(result.current.occupantData?.preorders[0].breakfast).toBe('PREPAID_MP_A');
    });

    it('filters out items with no resolvable night key', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          preordersData: [
            { breakfast: 'PREPAID_MP_A', drink1: 'NA', drink2: 'NA' } as never,
          ],
        }),
      );
      expect(result.current.occupantData?.preorders).toHaveLength(0);
    });

    it('derives Night key from id when night field is missing', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          guestRoomData: { 'occ_ABC': { allocated: '5', booked: '3' } },
          preordersData: [
            { id: 'night2', breakfast: 'PREPAID_MP_B', drink1: 'NA', drink2: 'NA' } as never,
          ],
        }),
      );
      expect(result.current.occupantData?.preorders).toHaveLength(1);
      expect(result.current.occupantData?.preorders[0].night).toBe('Night2');
    });

    it('passes through lowercase night keys unchanged (case-insensitive check accepts them)', () => {
      // The normalization regex uses /i so 'night1' already matches — no rewrite occurs
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          guestRoomData: { 'occ_ABC': { allocated: '5', booked: '3' } },
          preordersData: [
            { id: 'x', night: 'night1', breakfast: 'PREPAID_MP_A', drink1: 'NA', drink2: 'NA' },
          ],
        }),
      );
      expect(result.current.occupantData?.preorders[0].night).toBe('night1');
    });
  });

  describe('processPreorders — object format', () => {
    it('returns occupant-specific preorders when occupantRoomIdKey matches', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          guestRoomData: { 'occ_ABC': { allocated: '5', booked: '3' } },
          preordersData: {
            'occ_ABC': {
              'Night1': { night: 'Night1', breakfast: 'PREPAID_MP_A', drink1: 'TEA', drink2: 'NA' },
            },
          },
        }),
      );
      expect(result.current.occupantData?.preorders).toHaveLength(1);
      expect(result.current.occupantData?.preorders[0].night).toBe('Night1');
    });

    it('returns empty array when occupantRoomIdKey is not in object data', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          guestRoomData: { 'occ_ABC': { allocated: '5', booked: '3' } },
          preordersData: {
            'occ_DIFFERENT': {
              'Night1': { night: 'Night1', breakfast: 'PREPAID_MP_A', drink1: 'NA', drink2: 'NA' },
            },
          },
        }),
      );
      expect(result.current.occupantData?.preorders).toHaveLength(0);
    });

    it('returns empty array when occupantRoomIdKey is null and data is object format', () => {
      const { result } = renderHook(() =>
        useOccupantTransform({
          ...emptyInput,
          bookingsData: baseBooking,
          // no guestRoomData → occupantRoomIdKey is null
          preordersData: {
            'occ_ABC': {
              'Night1': { night: 'Night1', breakfast: 'PREPAID_MP_A', drink1: 'NA', drink2: 'NA' },
            },
          },
        }),
      );
      expect(result.current.occupantData?.preorders).toHaveLength(0);
    });
  });
});
