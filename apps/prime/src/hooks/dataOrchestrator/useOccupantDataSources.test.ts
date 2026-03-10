import '@testing-library/jest-dom';

import { act, renderHook } from '@testing-library/react';

import { useFetchBagStorageData } from '../pureData/useFetchBagStorageData';
import { useFetchBookingsData } from '../pureData/useFetchBookingsData.client';
import { useFetchCityTax } from '../pureData/useFetchCityTax';
import { useFetchCompletedTasks } from '../pureData/useFetchCompletedTasksData';
import { useFetchFinancialsRoom } from '../pureData/useFetchFinancialsRoom';
import { useFetchGuestByRoom } from '../pureData/useFetchGuestByRoom';
import { useFetchGuestDetails } from '../pureData/useFetchGuestDetails';
import { useFetchLoans } from '../pureData/useFetchLoans';
import { useFetchPreordersData } from '../pureData/useFetchPreordersData';

import { useOccupantDataSources } from './useOccupantDataSources';

jest.mock('../pureData/useFetchBookingsData.client', () => ({
  useFetchBookingsData: jest.fn(),
}));
jest.mock('../pureData/useFetchCompletedTasksData', () => ({
  useFetchCompletedTasks: jest.fn(),
}));
jest.mock('../pureData/useFetchLoans', () => ({
  useFetchLoans: jest.fn(),
}));
jest.mock('../pureData/useFetchGuestByRoom', () => ({
  useFetchGuestByRoom: jest.fn(),
}));
jest.mock('../pureData/useFetchPreordersData', () => ({
  useFetchPreordersData: jest.fn(),
}));
jest.mock('../pureData/useFetchBagStorageData', () => ({
  useFetchBagStorageData: jest.fn(),
}));
jest.mock('../pureData/useFetchGuestDetails', () => ({
  useFetchGuestDetails: jest.fn(),
}));
jest.mock('../pureData/useFetchFinancialsRoom', () => ({
  useFetchFinancialsRoom: jest.fn(),
}));
jest.mock('../pureData/useFetchCityTax', () => ({
  useFetchCityTax: jest.fn(),
}));

const mockUseFetchBookingsData = useFetchBookingsData as jest.MockedFunction<typeof useFetchBookingsData>;
const mockUseFetchCompletedTasks = useFetchCompletedTasks as jest.MockedFunction<typeof useFetchCompletedTasks>;
const mockUseFetchLoans = useFetchLoans as jest.MockedFunction<typeof useFetchLoans>;
const mockUseFetchGuestByRoom = useFetchGuestByRoom as jest.MockedFunction<typeof useFetchGuestByRoom>;
const mockUseFetchPreordersData = useFetchPreordersData as jest.MockedFunction<typeof useFetchPreordersData>;
const mockUseFetchBagStorageData = useFetchBagStorageData as jest.MockedFunction<typeof useFetchBagStorageData>;
const mockUseFetchGuestDetails = useFetchGuestDetails as jest.MockedFunction<typeof useFetchGuestDetails>;
const mockUseFetchFinancialsRoom = useFetchFinancialsRoom as jest.MockedFunction<typeof useFetchFinancialsRoom>;
const mockUseFetchCityTax = useFetchCityTax as jest.MockedFunction<typeof useFetchCityTax>;

describe('useOccupantDataSources', () => {
  const refetchBookings = jest.fn(async () => {});
  const refetchLoans = jest.fn(async () => {});
  const refetchGuestByRoom = jest.fn(async () => {});
  const refetchPreorders = jest.fn(async () => {});
  const refetchGuestDetails = jest.fn(async () => {});
  const refetchFinancials = jest.fn(async () => {});
  const refetchCityTax = jest.fn(async () => {});

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseFetchBookingsData.mockReturnValue({
      bookingsData: null,
      isLoading: false,
      error: null,
      refetch: refetchBookings,
    });

    mockUseFetchCompletedTasks.mockReturnValue({
      uuid: 'occ_1234567890123',
      occupantTasks: {},
      isLoading: false,
      isError: false,
      isUuidMissing: false,
    });

    mockUseFetchLoans.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      refetch: refetchLoans,
    });

    mockUseFetchGuestByRoom.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      refetch: refetchGuestByRoom,
    });

    mockUseFetchPreordersData.mockReturnValue({
      preordersData: null,
      isLoading: false,
      error: null,
      refetch: refetchPreorders,
    });

    mockUseFetchBagStorageData.mockReturnValue({
      bagStorageData: null,
      isLoading: false,
      error: null,
    });

    mockUseFetchGuestDetails.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      refetch: refetchGuestDetails,
    });

    mockUseFetchFinancialsRoom.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      refetch: refetchFinancials,
    });

    mockUseFetchCityTax.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      isError: false,
      refetch: refetchCityTax,
    });
  });

  it('gates Phase 2 hooks when bookingsData is not available', () => {
    renderHook(() => useOccupantDataSources());

    expect(mockUseFetchLoans).toHaveBeenCalledWith({ enabled: false });
    expect(mockUseFetchGuestByRoom).toHaveBeenCalledWith({ enabled: false });
    expect(mockUseFetchBagStorageData).toHaveBeenCalledWith({ enabled: false });
    expect(mockUseFetchGuestDetails).toHaveBeenCalledWith('');
    expect(mockUseFetchFinancialsRoom).toHaveBeenCalledWith('');
    expect(mockUseFetchCityTax).toHaveBeenCalledWith('');
  });

  it('enables secondary/dependent hooks when bookingsData is present', () => {
    mockUseFetchBookingsData.mockReturnValue({
      bookingsData: {
        reservationCode: 'RES-001',
      } as any,
      isLoading: false,
      error: null,
      refetch: refetchBookings,
    });

    renderHook(() => useOccupantDataSources());

    expect(mockUseFetchLoans).toHaveBeenCalledWith({ enabled: true });
    expect(mockUseFetchGuestByRoom).toHaveBeenCalledWith({ enabled: true });
    expect(mockUseFetchBagStorageData).toHaveBeenCalledWith({ enabled: true });
    expect(mockUseFetchGuestDetails).toHaveBeenCalledWith('RES-001');
    expect(mockUseFetchFinancialsRoom).toHaveBeenCalledWith('RES-001');
    expect(mockUseFetchCityTax).toHaveBeenCalledWith('RES-001');
  });

  it('aggregates loading/error fields deterministically', () => {
    const bookingsError = new Error('bookings failed');
    mockUseFetchBookingsData.mockReturnValue({
      bookingsData: null,
      isLoading: true,
      error: bookingsError,
      refetch: refetchBookings,
    });

    const { result } = renderHook(() => useOccupantDataSources());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isBookingsLoading).toBe(true);
    expect(result.current.error).toBe(bookingsError);
  });

  it('wraps completedTasks boolean error into an Error instance', () => {
    mockUseFetchCompletedTasks.mockReturnValue({
      uuid: 'occ_1234567890123',
      occupantTasks: {},
      isLoading: false,
      isError: true,
      isUuidMissing: false,
    });

    const { result } = renderHook(() => useOccupantDataSources());

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Failed to load occupant tasks');
  });

  it('refetch fan-out calls all supported fetch hooks except realtime tasks/bagStorage', async () => {
    const { result } = renderHook(() => useOccupantDataSources());

    await act(async () => {
      await result.current.refetch();
    });

    expect(refetchBookings).toHaveBeenCalledTimes(1);
    expect(refetchLoans).toHaveBeenCalledTimes(1);
    expect(refetchGuestDetails).toHaveBeenCalledTimes(1);
    expect(refetchGuestByRoom).toHaveBeenCalledTimes(1);
    expect(refetchFinancials).toHaveBeenCalledTimes(1);
    expect(refetchPreorders).toHaveBeenCalledTimes(1);
    expect(refetchCityTax).toHaveBeenCalledTimes(1);
  });

  it('passes through bagStorage data when present', () => {
    const bagStorageData = { optedIn: true, requestStatus: 'confirmed' };
    mockUseFetchBagStorageData.mockReturnValue({
      bagStorageData: bagStorageData as any,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useOccupantDataSources());

    expect(result.current.bagStorageData).toEqual(bagStorageData);
  });
});
