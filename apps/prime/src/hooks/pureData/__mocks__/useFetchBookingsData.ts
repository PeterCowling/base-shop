// __mocks__/useFetchBookingsData.ts
// Manual Jest mock for useFetchBookingsData

import type { BookingDetails } from '../useFetchBookingsData';

interface MockReturn {
  bookingsData: BookingDetails | null;
  isLoading: boolean;
  error: unknown;
}

// Mutable state that tests can modify
export const __mockReturn: MockReturn = {
  bookingsData: null,
  isLoading: false,
  error: null,
};

// Reset function for beforeEach
export const __resetMock = () => {
  __mockReturn.bookingsData = null;
  __mockReturn.isLoading = false;
  __mockReturn.error = null;
};

// The actual mock implementation
export const useFetchBookingsData = jest.fn(() => __mockReturn);
