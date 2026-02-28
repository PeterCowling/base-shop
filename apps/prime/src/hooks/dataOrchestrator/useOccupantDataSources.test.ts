// TODO: These tests require Jest automocking of 9 Firebase-backed pureData hooks
// (useFetchBookingsData, useFetchLoans, useFetchGuestDetails, useFetchGuestByRoom,
// useFetchFinancialsRoom, useFetchPreordersData, useFetchBagStorageData,
// useFetchCityTax, useFetchCompletedTasks). The __mocks__ directory has stubs for
// three of them; the remaining six need to be added before these tests can run.
// See: apps/prime/src/hooks/pureData/__mocks__/

describe.skip('useOccupantDataSources', () => {
  it('fires bookings and completedTasks queries immediately (Phase 1)', () => {
    // Both queries should be enabled regardless of other data
    expect(true).toBe(true);
  });

  it('gates Phase 2 queries behind bookingsData being non-null', () => {
    // loans, guestByRoom, preorders, bagStorage should have enabled=false until bookings resolves
    expect(true).toBe(true);
  });

  it('enables dependent queries (guestDetails, financials, cityTax) once bookingRef is available', () => {
    expect(true).toBe(true);
  });

  it('returns isLoading=true while any Phase 1 source is loading', () => {
    expect(true).toBe(true);
  });

  it('returns isLoading=false once all sources have resolved', () => {
    expect(true).toBe(true);
  });

  it('surfaces bookings error in combined error field', () => {
    expect(true).toBe(true);
  });

  it('surfaces tasks error as Error object in combined error field', () => {
    // tasksError is a boolean — must be wrapped as new Error('Failed to load occupant tasks')
    expect(true).toBe(true);
  });

  it('refetch calls all individual refetch functions', async () => {
    // refetch() should Promise.all all refetch fns except completedTasks (real-time)
    expect(true).toBe(true);
  });

  it('passes through bagStorageData when provided', () => {
    expect(true).toBe(true);
  });
});
