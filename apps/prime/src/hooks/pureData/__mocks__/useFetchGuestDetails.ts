// __mocks__/useFetchGuestDetails.ts
// Manual Jest mock for useFetchGuestDetails

import type { GuestDetailsRecord } from '@/types/guestsDetails';

interface MockReturn {
  data: GuestDetailsRecord | null;
  isLoading: boolean;
  error: unknown;
}

// Mutable state that tests can modify
export const __mockReturn: MockReturn = {
  data: null,
  isLoading: false,
  error: null,
};

// Reset function for beforeEach
export const __resetMock = () => {
  __mockReturn.data = null;
  __mockReturn.isLoading = false;
  __mockReturn.error = null;
};

// The actual mock implementation (takes reservationCode but we ignore it in mock)
export const useFetchGuestDetails = jest.fn((_reservationCode?: string) => __mockReturn);
