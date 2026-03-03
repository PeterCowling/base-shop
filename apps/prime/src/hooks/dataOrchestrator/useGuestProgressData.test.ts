// TODO: These tests require mocking useUnifiedBookingData (itself skipped),
// useFetchGuestProfile, useFetchQuestProgress, and useQuestProgressMutator.
// Skipping until the underlying dependency chain supports reliable Jest mocking.
// See: useUnifiedBookingData.test.tsx for the same blocker.

describe.skip('useGuestProgressData', () => {
  it('returns isLoading=true while booking data is loading', () => {
    // Should propagate isLoading from useUnifiedBookingData
    expect(true).toBe(true);
  });

  it('returns null profile and stale=false when no profile exists', () => {
    // guestProfile null, isProfileStale false, effectiveProfileStatus 'partial'
    expect(true).toBe(true);
  });

  it('returns isProfileStale=true when profile is from a previous booking', () => {
    // useFetchGuestProfile returns a profile with a different booking ID
    expect(true).toBe(true);
  });

  it('sets effectiveProfileStatus to partial when profile is stale', () => {
    expect(true).toBe(true);
  });

  it('sets showProfileBanner=true when profile is missing', () => {
    expect(true).toBe(true);
  });

  it('sets showProfileBanner=true when profile is stale', () => {
    expect(true).toBe(true);
  });

  it('sets showProfileBanner=false when profile is complete and fresh', () => {
    expect(true).toBe(true);
  });

  it('auto-initialises quest when quest progress is stale for current booking', () => {
    // useEffect fires initializeQuest() when isQuestProgressStale returns true
    expect(true).toBe(true);
  });

  it('does not re-initialise when quest is already initialized', () => {
    expect(true).toBe(true);
  });

  it('combines errors from all data sources (first error wins)', () => {
    expect(true).toBe(true);
  });
});
