/**
 * Mock implementation for `diffHistory` used across VersionTimeline tests.
 *
 * The component expects a list of `SettingsDiffEntry` objects shaped like:
 * `{ timestamp: string; diff: Partial<ShopSettings> }`.
 * Provide a sensible default so tests can rely on the mock without having to
 * specify return values for every call.
 */
export const diffHistoryMock = jest
  .fn()
  .mockResolvedValue([{ timestamp: "t0", diff: { title: "A" } }]);
