// __mocks__/useFetchBookingsData.ts
// Manual Jest mock for useFetchBookingsData

import type { BookingDetails } from '../useFetchBookingsData';
import type { PureDataRefetch } from '../types';

interface MockReturn {
  bookingsData: BookingDetails | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<void>;
}

// Mutable state that tests can modify
export const __mockReturn: MockReturn = {
  bookingsData: null,
  isLoading: false,
  error: null,
  refetch: jest.fn(async () => {}) as jest.MockedFunction<PureDataRefetch>,
};

// Reset function for beforeEach
export const __resetMock = () => {
  __mockReturn.bookingsData = null;
  __mockReturn.isLoading = false;
  __mockReturn.error = null;
  __mockReturn.refetch = jest.fn(async () => {}) as jest.MockedFunction<PureDataRefetch>;
};

// The actual mock implementation
export const useFetchBookingsData = jest.fn(() => __mockReturn);
