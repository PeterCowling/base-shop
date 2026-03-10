// __mocks__/useFetchPreordersData.ts
// Manual Jest mock for useFetchPreordersData

import type { PreorderNightData } from '@/types/preorder';

import type { PureDataRefetch } from '../types';

interface MockReturn {
  preordersData: Array<PreorderNightData & { id: string }>;
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<void>;
}

// Mutable state that tests can modify
export const __mockReturn: MockReturn = {
  preordersData: [],
  isLoading: false,
  error: null,
  refetch: jest.fn(async () => {}) as jest.MockedFunction<PureDataRefetch>,
};

// Reset function for beforeEach
export const __resetMock = () => {
  __mockReturn.preordersData = [];
  __mockReturn.isLoading = false;
  __mockReturn.error = null;
  __mockReturn.refetch = jest.fn(async () => {}) as jest.MockedFunction<PureDataRefetch>;
};

// The actual mock implementation
export const useFetchPreordersData = jest.fn(() => __mockReturn);
