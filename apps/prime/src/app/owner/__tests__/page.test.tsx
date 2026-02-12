/**
 * TASK-48 TC-03: Owner dashboard rendering tests
 *
 * Tests that owner page renders KPI cards from aggregate-backed data.
 */

import { render, screen } from '@testing-library/react';

import { readKpiRange } from '../../../lib/owner/kpiReader';
import OwnerPage from '../page';

// Mock kpiReader
jest.mock('../../../lib/owner/kpiReader', () => ({
  readKpiRange: jest.fn(),
}));

// Mock security gate
jest.mock('../../../lib/security/staffOwnerGate', () => ({
  canAccessStaffOwnerRoutes: jest.fn(() => true),
}));

const mockedReadKpiRange = readKpiRange as jest.MockedFunction<typeof readKpiRange>;

describe('Owner dashboard page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC-03: renders KPI cards from aggregate-backed API response', async () => {
    mockedReadKpiRange.mockResolvedValue([
      {
        date: '2026-02-06',
        guestCount: 8,
        readinessCompletionPct: 75,
        etaSubmissionPct: 80,
        arrivalCodeGenPct: 90,
        medianCheckInLagMinutes: 60,
        extensionRequestCount: 3,
        bagDropRequestCount: 2,
        updatedAt: 1707312000000,
      },
      {
        date: '2026-02-07',
        guestCount: 12,
        readinessCompletionPct: 85,
        etaSubmissionPct: 90,
        arrivalCodeGenPct: 100,
        medianCheckInLagMinutes: 45,
        extensionRequestCount: 1,
        bagDropRequestCount: 4,
        updatedAt: 1707398400000,
      },
      {
        date: '2026-02-08',
        guestCount: 5,
        readinessCompletionPct: 92,
        etaSubmissionPct: 85,
        arrivalCodeGenPct: 95,
        medianCheckInLagMinutes: 30,
        extensionRequestCount: 0,
        bagDropRequestCount: 1,
        updatedAt: 1707484800000,
      },
    ]);

    const { container } = render(await OwnerPage());

    // Check for KPI metric cards
    expect(screen.getByText(/Average Readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/ETA Submission/i)).toBeInTheDocument();
    expect(screen.getByText(/Code Generation/i)).toBeInTheDocument();
    expect(screen.getByText(/Check-in Lag/i)).toBeInTheDocument();

    // Check for values (averaged or summed across days)
    // Average readiness: (75 + 85 + 92) / 3 = 84
    expect(container.textContent).toMatch(/84%/);

    // Check that readKpiRange was called
    expect(mockedReadKpiRange).toHaveBeenCalledTimes(1);
  });

  it('handles empty KPI data gracefully', async () => {
    mockedReadKpiRange.mockResolvedValue([]);

    render(await OwnerPage());

    // Should still render page structure without crashing
    expect(screen.getByText(/Owner Dashboard/i)).toBeInTheDocument();
  });

  it('handles zero-safe defaults without division errors', async () => {
    mockedReadKpiRange.mockResolvedValue([
      {
        date: '2026-02-08',
        guestCount: 0,
        readinessCompletionPct: 0,
        etaSubmissionPct: 0,
        arrivalCodeGenPct: 0,
        medianCheckInLagMinutes: 0,
        extensionRequestCount: 0,
        bagDropRequestCount: 0,
        updatedAt: 1707484800000,
      },
    ]);

    const { container } = render(await OwnerPage());

    // Should render without NaN or errors
    expect(container.textContent).not.toMatch(/NaN/);
    expect(screen.getByText(/Owner Dashboard/i)).toBeInTheDocument();
  });

  it('displays guest count summary', async () => {
    mockedReadKpiRange.mockResolvedValue([
      {
        date: '2026-02-08',
        guestCount: 15,
        readinessCompletionPct: 80,
        etaSubmissionPct: 85,
        arrivalCodeGenPct: 90,
        medianCheckInLagMinutes: 45,
        extensionRequestCount: 2,
        bagDropRequestCount: 3,
        updatedAt: 1707484800000,
      },
    ]);

    render(await OwnerPage());

    // Should show guest count in "Total Guests" card
    expect(screen.getByText('Total Guests')).toBeInTheDocument();
    expect(screen.getByText('15 guests')).toBeInTheDocument();
  });

  it('displays request counts', async () => {
    mockedReadKpiRange.mockResolvedValue([
      {
        date: '2026-02-08',
        guestCount: 10,
        readinessCompletionPct: 75,
        etaSubmissionPct: 80,
        arrivalCodeGenPct: 85,
        medianCheckInLagMinutes: 50,
        extensionRequestCount: 5,
        bagDropRequestCount: 7,
        updatedAt: 1707484800000,
      },
    ]);

    const { container } = render(await OwnerPage());

    // Should show extension and bag drop request counts
    expect(container.textContent).toMatch(/5/);
    expect(container.textContent).toMatch(/7/);
  });
});
