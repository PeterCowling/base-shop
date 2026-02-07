import { render, screen } from '@testing-library/react';
import StaffReadinessBadges from '../../../components/check-in/StaffReadinessBadges';

describe('StaffReadinessBadges', () => {
  it('TC-03: staff UI renders readiness badges from API payload', () => {
    render(
      <StaffReadinessBadges
        readiness={{
          etaConfirmed: true,
          cashPrepared: false,
          routePlanned: true,
          rulesReviewed: true,
          locationSaved: false,
          readinessScore: 60,
        }}
        personalization={{
          arrivalMethodPreference: 'ferry',
          arrivalConfidence: 'confident',
        }}
      />,
    );

    expect(screen.getByText('Arrival readiness')).toBeDefined();
    expect(screen.getByText('60%')).toBeDefined();
    expect(screen.getByText('ETA shared: Ready')).toBeDefined();
    expect(screen.getByText('Cash prepared: Pending')).toBeDefined();
    expect(screen.getByText('Context: method ferry, confidence confident')).toBeDefined();
  });
});
