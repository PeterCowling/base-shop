// __mocks__/useFetchPreordersData.ts
// Manual Jest mock for useFetchPreordersData

import type { PreorderNightData } from '@/types/preorder';

interface MockReturn {
  preordersData: Array<PreorderNightData & { id: string }>;
  isLoading: boolean;
  error: unknown;
}

// Mutable state that tests can modify
export const __mockReturn: MockReturn = {
  preordersData: [],
  isLoading: false,
  error: null,
};

// Reset function for beforeEach
export const __resetMock = () => {
  __mockReturn.preordersData = [];
  __mockReturn.isLoading = false;
  __mockReturn.error = null;
};

// The actual mock implementation
export const useFetchPreordersData = jest.fn(() => __mockReturn);
