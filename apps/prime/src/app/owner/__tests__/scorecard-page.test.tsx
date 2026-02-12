/**
 * TASK-49 TC-03: Owner scorecard page UI tests
 *
 * Tests that scorecard page renders KPI status states and target thresholds correctly.
 */

import { render, screen } from '@testing-library/react';

import { type DailyKpiRecord } from '../../../lib/owner/kpiAggregator';
import { readKpiRange } from '../../../lib/owner/kpiReader';
import ScorecardPage from '../scorecard/page';

// Mock the kpiReader module
jest.mock('../../../lib/owner/kpiReader', () => ({
  readKpiRange: jest.fn(),
}));

// Mock the security gate
jest.mock('../../../lib/security/staffOwnerGate', () => ({
  canAccessStaffOwnerRoutes: jest.fn(() => true),
  getStaffOwnerGateMessage: jest.fn(() => 'Staff/Owner routes are disabled in development mode.'),
}));

const mockedReadKpiRange = readKpiRange as jest.MockedFunction<typeof readKpiRange>;

describe('Owner scorecard page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC-03: Scorecard UI renders KPI status states and target thresholds', () => {
    it('renders scorecard with success status when metrics meet targets', async () => {
      const mockData: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 95,
          etaSubmissionPct: 95,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 10,
          extensionRequestCount: 1,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 12,
          readinessCompletionPct: 92,
          etaSubmissionPct: 93,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 12,
          extensionRequestCount: 0,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 8,
          readinessCompletionPct: 93,
          etaSubmissionPct: 91,
          arrivalCodeGenPct: 100,
          medianCheckInLagMinutes: 14,
          extensionRequestCount: 2,
          bagDropRequestCount: 0,
          updatedAt: Date.now(),
        },
      ];

      mockedReadKpiRange.mockResolvedValue(mockData);

      const PageComponent = await ScorecardPage();
      render(PageComponent);

      // Check that scorecard title is rendered
      expect(screen.getByText('Business Impact Scorecard')).toBeInTheDocument();

      // Check that success indicators are shown
      expect(screen.getAllByText('Success').length).toBeGreaterThan(0);
    });

    it('renders scorecard with warning status when metrics miss targets', async () => {
      const mockData: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 75,
          etaSubmissionPct: 80,
          arrivalCodeGenPct: 90,
          medianCheckInLagMinutes: 30,
          extensionRequestCount: 5,
          bagDropRequestCount: 3,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 12,
          readinessCompletionPct: 70,
          etaSubmissionPct: 75,
          arrivalCodeGenPct: 85,
          medianCheckInLagMinutes: 35,
          extensionRequestCount: 6,
          bagDropRequestCount: 4,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 8,
          readinessCompletionPct: 72,
          etaSubmissionPct: 78,
          arrivalCodeGenPct: 87,
          medianCheckInLagMinutes: 32,
          extensionRequestCount: 4,
          bagDropRequestCount: 3,
          updatedAt: Date.now(),
        },
      ];

      mockedReadKpiRange.mockResolvedValue(mockData);

      const PageComponent = await ScorecardPage();
      render(PageComponent);

      // Check that warning indicators are shown
      expect(screen.getAllByText('Warning').length).toBeGreaterThan(0);
    });

    it('renders insufficient data notice when data is missing', async () => {
      const mockData: DailyKpiRecord[] = [];

      mockedReadKpiRange.mockResolvedValue(mockData);

      const PageComponent = await ScorecardPage();
      render(PageComponent);

      // Check for insufficient data message
      expect(
        screen.getByText(/Insufficient data to generate scorecard/i),
      ).toBeInTheDocument();
    });

    it('displays target thresholds for each metric', async () => {
      const mockData: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 85,
          arrivalCodeGenPct: 95,
          medianCheckInLagMinutes: 20,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 85,
          arrivalCodeGenPct: 95,
          medianCheckInLagMinutes: 20,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 85,
          arrivalCodeGenPct: 95,
          medianCheckInLagMinutes: 20,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
      ];

      mockedReadKpiRange.mockResolvedValue(mockData);

      const PageComponent = await ScorecardPage();
      render(PageComponent);

      // Check for target display (targets are defined in SCORECARD_TARGETS)
      // Both readiness and ETA submission have 90% targets
      const targets = screen.getAllByText(/Target: 90%/i);
      expect(targets.length).toBeGreaterThan(0);
    });

    it('renders operating review template section', async () => {
      const mockData: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 75,
          etaSubmissionPct: 80,
          arrivalCodeGenPct: 90,
          medianCheckInLagMinutes: 30,
          extensionRequestCount: 5,
          bagDropRequestCount: 3,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 10,
          readinessCompletionPct: 75,
          etaSubmissionPct: 80,
          arrivalCodeGenPct: 90,
          medianCheckInLagMinutes: 30,
          extensionRequestCount: 5,
          bagDropRequestCount: 3,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 10,
          readinessCompletionPct: 75,
          etaSubmissionPct: 80,
          arrivalCodeGenPct: 90,
          medianCheckInLagMinutes: 30,
          extensionRequestCount: 5,
          bagDropRequestCount: 3,
          updatedAt: Date.now(),
        },
      ];

      mockedReadKpiRange.mockResolvedValue(mockData);

      const PageComponent = await ScorecardPage();
      render(PageComponent);

      // Check for operating review section
      expect(screen.getByText('Weekly Operating Review')).toBeInTheDocument();
    });

    it('shows metric lineage and aggregate-node dependencies', async () => {
      const mockData: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 85,
          arrivalCodeGenPct: 95,
          medianCheckInLagMinutes: 20,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 85,
          arrivalCodeGenPct: 95,
          medianCheckInLagMinutes: 20,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 85,
          arrivalCodeGenPct: 95,
          medianCheckInLagMinutes: 20,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
      ];

      mockedReadKpiRange.mockResolvedValue(mockData);

      const PageComponent = await ScorecardPage();
      render(PageComponent);

      // Check for data lineage documentation
      expect(screen.getByText('Data Sources')).toBeInTheDocument();
      expect(screen.getByText(/ownerKpis/i)).toBeInTheDocument();
    });

    it('displays all three scorecard sections: guest, staff, business', async () => {
      const mockData: DailyKpiRecord[] = [
        {
          date: '2026-02-01',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 85,
          arrivalCodeGenPct: 95,
          medianCheckInLagMinutes: 20,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-02',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 85,
          arrivalCodeGenPct: 95,
          medianCheckInLagMinutes: 20,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
        {
          date: '2026-02-03',
          guestCount: 10,
          readinessCompletionPct: 85,
          etaSubmissionPct: 85,
          arrivalCodeGenPct: 95,
          medianCheckInLagMinutes: 20,
          extensionRequestCount: 2,
          bagDropRequestCount: 1,
          updatedAt: Date.now(),
        },
      ];

      mockedReadKpiRange.mockResolvedValue(mockData);

      const PageComponent = await ScorecardPage();
      render(PageComponent);

      // Check for section headers
      expect(screen.getByText('Guest Engagement')).toBeInTheDocument();
      expect(screen.getByText('Staff Efficiency')).toBeInTheDocument();
      expect(screen.getByText('Business Impact')).toBeInTheDocument();
    });
  });

  it('renders security gate notice when access is disabled', async () => {
    const { canAccessStaffOwnerRoutes } = require('../../../lib/security/staffOwnerGate');
    canAccessStaffOwnerRoutes.mockReturnValue(false);

    const PageComponent = await ScorecardPage();
    render(PageComponent);

    expect(
      screen.getByText(/staff\/owner routes are disabled/i),
    ).toBeInTheDocument();
  });
});
