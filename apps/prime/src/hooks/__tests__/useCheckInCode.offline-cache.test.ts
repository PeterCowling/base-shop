/**
 * useCheckInCode.offline-cache.test.ts
 *
 * Tests for offline caching functionality in useCheckInCode hook.
 * Tests the codeCache utility module.
 */

import { cacheCheckInCode, clearCachedCheckInCode,getCachedCheckInCode } from '../../lib/arrival/codeCache';

describe('useCheckInCode offline cache', () => {
  let localStorageGetItemSpy: jest.SpyInstance;
  let localStorageSetItemSpy: jest.SpyInstance;
  let localStorageRemoveItemSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock localStorage
    localStorageGetItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    localStorageSetItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    localStorageRemoveItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

    // Clear all mocks
    localStorageGetItemSpy.mockClear();
    localStorageSetItemSpy.mockClear();
    localStorageRemoveItemSpy.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('TC-01: cacheCheckInCode stores code with timestamp', () => {
    it('should store code in localStorage with correct key format', () => {
      const code = 'BRK-A7K9M';
      const uuid = 'occ_1234567890123';
      const expectedKey = `prime_checkin_code_${uuid}`;

      cacheCheckInCode(code, uuid);

      expect(localStorageSetItemSpy).toHaveBeenCalledWith(
        expectedKey,
        expect.stringContaining(code)
      );
    });

    it('should store code with timestamp in JSON format', () => {
      const code = 'BRK-A7K9M';
      const uuid = 'occ_1234567890123';
      const beforeTimestamp = Date.now();

      cacheCheckInCode(code, uuid);

      const storedValue = localStorageSetItemSpy.mock.calls[0][1];
      const parsed = JSON.parse(storedValue);

      expect(parsed).toHaveProperty('code', code);
      expect(parsed).toHaveProperty('cachedAt');
      expect(parsed.cachedAt).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(parsed.cachedAt).toBeLessThanOrEqual(Date.now());
    });

    it('should retrieve cached code with timestamp after caching', () => {
      const code = 'BRK-A7K9M';
      const uuid = 'occ_1234567890123';
      const beforeTimestamp = Date.now();

      // Set up mock to return what we store
      localStorageSetItemSpy.mockImplementation((key, value) => {
        localStorageGetItemSpy.mockReturnValue(value);
      });

      cacheCheckInCode(code, uuid);
      const cached = getCachedCheckInCode(uuid);

      expect(cached).not.toBeNull();
      expect(cached?.code).toBe(code);
      expect(cached?.cachedAt).toBeGreaterThanOrEqual(beforeTimestamp);
    });
  });

  describe('TC-02: getCachedCheckInCode retrieves cached data when offline', () => {
    it('should return cached code when data exists', () => {
      const code = 'BRK-A7K9M';
      const uuid = 'occ_1234567890123';
      const cachedAt = Date.now();
      const cachedData = JSON.stringify({ code, cachedAt });

      localStorageGetItemSpy.mockReturnValue(cachedData);

      const result = getCachedCheckInCode(uuid);

      expect(result).toEqual({ code, cachedAt });
    });

    it('should return null when no cached data exists', () => {
      const uuid = 'occ_1234567890123';
      localStorageGetItemSpy.mockReturnValue(null);

      const result = getCachedCheckInCode(uuid);

      expect(result).toBeNull();
    });

    it('should return null when cached data is invalid JSON', () => {
      const uuid = 'occ_1234567890123';
      localStorageGetItemSpy.mockReturnValue('invalid-json{{{');

      const result = getCachedCheckInCode(uuid);

      expect(result).toBeNull();
    });
  });

  describe('TC-03: cacheCheckInCode replaces old cache with new code', () => {
    it('should overwrite existing cached code', () => {
      const uuid = 'occ_1234567890123';
      const oldCode = 'BRK-OLD123';
      const newCode = 'BRK-NEW456';

      // Set up mock to simulate storage
      const storage: Record<string, string> = {};
      localStorageSetItemSpy.mockImplementation((key, value) => {
        storage[key] = value;
      });
      localStorageGetItemSpy.mockImplementation((key) => storage[key] || null);

      // Cache first code
      cacheCheckInCode(oldCode, uuid);
      const firstCached = getCachedCheckInCode(uuid);
      expect(firstCached?.code).toBe(oldCode);

      // Cache second code
      cacheCheckInCode(newCode, uuid);
      const secondCached = getCachedCheckInCode(uuid);
      expect(secondCached?.code).toBe(newCode);
      expect(secondCached?.code).not.toBe(oldCode);
    });
  });

  describe('clearCachedCheckInCode removes cached data', () => {
    it('should remove cached code from localStorage', () => {
      const uuid = 'occ_1234567890123';
      const expectedKey = `prime_checkin_code_${uuid}`;

      clearCachedCheckInCode(uuid);

      expect(localStorageRemoveItemSpy).toHaveBeenCalledWith(expectedKey);
    });
  });
});
