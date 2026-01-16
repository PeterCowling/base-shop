// /apps/prime/src/test-utils/firebase-mock.ts
// Jest mock for Firebase services to avoid initialization errors in tests

import { jest } from '@jest/globals';

// Mock Firebase Database types
type MockDataSnapshot = {
  val: () => unknown;
  exists: () => boolean;
  key: string | null;
  ref: unknown;
};

type MockQuery = {
  toString: () => string;
};

type MockUnsubscribe = () => void;

// Create mock snapshot factory
export const createMockSnapshot = (data: unknown, key: string | null = null): MockDataSnapshot => ({
  val: () => data,
  exists: () => data !== null,
  key,
  ref: {},
});

// Mock database reference
export const mockRef = jest.fn().mockImplementation((db: unknown, path?: string) => ({
  toString: () => path ?? '/',
}));

// Mock query functions
export const mockQuery = jest.fn().mockImplementation((ref: unknown, ...constraints: unknown[]) => ({
  toString: () => 'mock-query',
}));

export const mockOrderByChild = jest.fn().mockImplementation((child: string) => ({
  type: 'orderByChild',
  child,
}));

export const mockEqualTo = jest.fn().mockImplementation((value: unknown) => ({
  type: 'equalTo',
  value,
}));

export const mockStartAt = jest.fn().mockImplementation((value: unknown) => ({
  type: 'startAt',
  value,
}));

export const mockEndAt = jest.fn().mockImplementation((value: unknown) => ({
  type: 'endAt',
  value,
}));

export const mockEndBefore = jest.fn().mockImplementation((value: unknown) => ({
  type: 'endBefore',
  value,
}));

export const mockLimitToLast = jest.fn().mockImplementation((limit: number) => ({
  type: 'limitToLast',
  limit,
}));

// Mock get function - returns empty data by default
export const mockGet = jest.fn().mockImplementation(
  async (queryRef: MockQuery): Promise<MockDataSnapshot> => createMockSnapshot(null)
);

// Mock onValue - calls callback immediately with empty data
export const mockOnValue = jest.fn().mockImplementation(
  (
    queryRef: MockQuery,
    callback: (snapshot: MockDataSnapshot) => void,
    errorCallback?: (error: Error) => void,
    options?: unknown
  ): MockUnsubscribe => {
    // Call callback immediately with mock data
    setTimeout(() => callback(createMockSnapshot(null)), 0);
    return jest.fn();
  }
);

// Mock set/update/push
export const mockSet = jest.fn(async () => undefined);
export const mockUpdate = jest.fn(async () => undefined);
export const mockPush = jest.fn(() => ({
  key: 'mock-push-key',
  toString: () => '/mock-push-key',
}));

// Mock off
export const mockOff = jest.fn();

// Mock child listeners
export const mockOnChildAdded = jest.fn().mockReturnValue(jest.fn());
export const mockOnChildChanged = jest.fn().mockReturnValue(jest.fn());
export const mockOnChildRemoved = jest.fn().mockReturnValue(jest.fn());

// Mock Storage functions
export const mockStorageRef = jest.fn().mockReturnValue({ toString: () => 'mock-storage-ref' });
export const mockUploadBytes = jest.fn(async () => ({ ref: {} }));
export const mockGetDownloadURL = jest.fn(async () => 'https://mock-url.com/file');
export const mockDeleteObject = jest.fn(async () => undefined);

// Mock Firebase app
export const mockFirebaseApp = {
  name: '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false,
};

// Mock Database instance
export const mockDb = {
  app: mockFirebaseApp,
  type: 'database',
};

// Mock Storage instance
export const mockStorage = {
  app: mockFirebaseApp,
  maxUploadRetryTime: 600000,
  maxOperationRetryTime: 120000,
};

// Export the complete mock module
export const firebaseMock = {
  // App
  firebaseApp: mockFirebaseApp,
  db: mockDb,
  storage: mockStorage,

  // Database functions
  ref: mockRef,
  query: mockQuery,
  orderByChild: mockOrderByChild,
  equalTo: mockEqualTo,
  startAt: mockStartAt,
  endAt: mockEndAt,
  endBefore: mockEndBefore,
  limitToLast: mockLimitToLast,
  get: mockGet,
  onValue: mockOnValue,
  set: mockSet,
  update: mockUpdate,
  push: mockPush,
  off: mockOff,
  onChildAdded: mockOnChildAdded,
  onChildChanged: mockOnChildChanged,
  onChildRemoved: mockOnChildRemoved,

  // Also export as fb* variants used in the service
  fbGet: mockGet,
  fbOnValue: mockOnValue,

  // Storage functions
  storageRef: mockStorageRef,
  uploadBytes: mockUploadBytes,
  getDownloadURL: mockGetDownloadURL,
  deleteObject: mockDeleteObject,
};

export default firebaseMock;
