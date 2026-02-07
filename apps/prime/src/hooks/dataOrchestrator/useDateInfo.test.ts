import "@testing-library/jest-dom";
import { renderHook } from '@testing-library/react';
import { useDateInfo } from './useDateInfo';

// Mock date utils
jest.mock('../../utils/dateUtils', () => ({
  parseCheckInDate: jest.fn((date: string) => new Date(date)),
  parseDateString: jest.fn((date: string) => new Date(date)),
  formatToYYYYMMDD: jest.fn((date: Date) => date.toISOString().split('T')[0]),
  formatDateToDDMM: jest.fn((date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }),
  getDaysBetween: jest.fn((from: string, to: string) => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  }),
  getLocalTimestamp: jest.fn(() => '2025-07-20T10:00:00'),
  computeOrderDate: jest.fn((checkInDate: string, nightKey: number) => {
    const date = new Date(checkInDate);
    date.setDate(date.getDate() + nightKey - 1);
    return date.toISOString().split('T')[0];
  }),
}));

describe('useDateInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock current date to 2025-07-20
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-07-20T10:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null values when checkInDate is missing', () => {
    const { result } = renderHook(() => useDateInfo({ nights: 3 }));

    expect(result.current.dateInfo).toEqual({
      daysUntilCheckIn: null,
      daysRemaining: null,
    });
    expect(result.current.isCheckedIn).toBe(false);
    expect(result.current.checkInDateDDMM).toBe('');
    expect(result.current.computedOrderDates).toEqual([]);
  });

  it('returns null values when nights is missing', () => {
    const { result } = renderHook(() => useDateInfo({ checkInDate: '2025-07-21' }));

    expect(result.current.dateInfo).toEqual({
      daysUntilCheckIn: null,
      daysRemaining: null,
    });
    expect(result.current.isCheckedIn).toBe(false);
  });

  it('calculates days until check-in for future booking', () => {
    const { result } = renderHook(() =>
      useDateInfo({ checkInDate: '2025-07-25', nights: 3 })
    );

    expect(result.current.dateInfo.daysUntilCheckIn).toBe(5);
    expect(result.current.dateInfo.daysRemaining).toBeNull();
    expect(result.current.isCheckedIn).toBe(false);
  });

  it('calculates days remaining for current stay', () => {
    const { result } = renderHook(() =>
      useDateInfo({ checkInDate: '2025-07-18', nights: 5 })
    );

    // Check-in was 2 days ago, checkout in 3 days
    expect(result.current.dateInfo.daysUntilCheckIn).toBeNull();
    expect(result.current.dateInfo.daysRemaining).toBe(3);
    expect(result.current.isCheckedIn).toBe(true);
  });

  it('formats check-in date as DD/MM', () => {
    const { result } = renderHook(() =>
      useDateInfo({ checkInDate: '2025-07-21', nights: 2 })
    );

    expect(result.current.checkInDateDDMM).toBe('21/07');
  });

  it('computes order dates for each night', () => {
    const { result } = renderHook(() =>
      useDateInfo({ checkInDate: '2025-07-21', nights: 3 })
    );

    expect(result.current.computedOrderDates).toHaveLength(3);
    expect(result.current.computedOrderDates[0]).toBe('2025-07-21');
    expect(result.current.computedOrderDates[1]).toBe('2025-07-22');
    expect(result.current.computedOrderDates[2]).toBe('2025-07-23');
  });

  it('returns local timestamp', () => {
    const { result } = renderHook(() =>
      useDateInfo({ checkInDate: '2025-07-21', nights: 2 })
    );

    expect(result.current.localTimestamp).toBe('2025-07-20T10:00:00');
  });

  it('handles checkout day (0 days remaining)', () => {
    const { result } = renderHook(() =>
      useDateInfo({ checkInDate: '2025-07-18', nights: 2 })
    );

    // Check-in was 2 days ago, checkout is today
    expect(result.current.dateInfo.daysRemaining).toBe(0);
    expect(result.current.isCheckedIn).toBe(false); // 0 days remaining = not checked in
  });
});
