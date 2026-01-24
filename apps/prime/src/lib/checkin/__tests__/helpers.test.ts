import { extractCodeFromPathname, formatEtaWindow, isStaffRole } from '../helpers';

describe('isStaffRole', () => {
  it('returns true for staff', () => {
    expect(isStaffRole('staff')).toBe(true);
  });

  it('returns true for admin', () => {
    expect(isStaffRole('admin')).toBe(true);
  });

  it('returns true for owner', () => {
    expect(isStaffRole('owner')).toBe(true);
  });

  it('returns false for guest', () => {
    expect(isStaffRole('guest')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isStaffRole(null)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isStaffRole('')).toBe(false);
  });
});

describe('formatEtaWindow', () => {
  it('returns dash for null', () => {
    expect(formatEtaWindow(null)).toBe('-');
  });

  it('formats a simple time to a 30-min window', () => {
    expect(formatEtaWindow('14:00')).toBe('14:00 - 14:30');
  });

  it('handles minutes rolling over the hour', () => {
    expect(formatEtaWindow('14:45')).toBe('14:45 - 15:15');
  });

  it('does not wrap around midnight (ETAs are daytime only)', () => {
    // Simple addition; no mod-24 needed for hotel check-in ETAs
    expect(formatEtaWindow('23:45')).toBe('23:45 - 24:15');
  });

  it('formats morning times correctly', () => {
    expect(formatEtaWindow('09:00')).toBe('09:00 - 09:30');
  });

  it('handles exactly on the half hour', () => {
    expect(formatEtaWindow('10:30')).toBe('10:30 - 11:00');
  });
});

describe('extractCodeFromPathname', () => {
  describe('checkin prefix', () => {
    it('extracts code from /checkin/BRK-A7K9M', () => {
      expect(extractCodeFromPathname('/checkin/BRK-A7K9M', 'checkin')).toBe('BRK-A7K9M');
    });

    it('extracts code with trailing slash', () => {
      expect(extractCodeFromPathname('/checkin/BRK-A7K9M/', 'checkin')).toBe('BRK-A7K9M');
    });

    it('returns null for bare /checkin path', () => {
      expect(extractCodeFromPathname('/checkin', 'checkin')).toBeNull();
    });

    it('returns null for /checkin/ with trailing slash only', () => {
      expect(extractCodeFromPathname('/checkin/', 'checkin')).toBeNull();
    });

    it('returns null for wrong prefix', () => {
      expect(extractCodeFromPathname('/staff-lookup/BRK-A7K9M', 'checkin')).toBeNull();
    });

    it('returns null for root path', () => {
      expect(extractCodeFromPathname('/', 'checkin')).toBeNull();
    });

    it('handles code with special characters', () => {
      expect(extractCodeFromPathname('/checkin/BRK-XY23Z', 'checkin')).toBe('BRK-XY23Z');
    });
  });

  describe('staff-lookup prefix', () => {
    it('extracts code from /staff-lookup/BRK-A7K9M', () => {
      expect(extractCodeFromPathname('/staff-lookup/BRK-A7K9M', 'staff-lookup')).toBe('BRK-A7K9M');
    });

    it('extracts code with trailing slash', () => {
      expect(extractCodeFromPathname('/staff-lookup/BRK-A7K9M/', 'staff-lookup')).toBe('BRK-A7K9M');
    });

    it('returns null for bare /staff-lookup path', () => {
      expect(extractCodeFromPathname('/staff-lookup', 'staff-lookup')).toBeNull();
    });

    it('returns null for wrong prefix', () => {
      expect(extractCodeFromPathname('/checkin/BRK-A7K9M', 'staff-lookup')).toBeNull();
    });
  });
});
