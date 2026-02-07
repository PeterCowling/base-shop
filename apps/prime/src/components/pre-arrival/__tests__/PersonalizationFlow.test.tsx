import { render, screen } from '@testing-library/react';
import StaffReadinessBadges from '../../check-in/StaffReadinessBadges';

describe('Personalization context visibility', () => {
  it('TC-03: personalized context appears in staff readiness payload surface', () => {
    render(
      <StaffReadinessBadges
        readiness={{
          etaConfirmed: true,
          cashPrepared: true,
          routePlanned: true,
          rulesReviewed: false,
          locationSaved: false,
          readinessScore: 70,
        }}
        personalization={{
          arrivalMethodPreference: 'train',
          arrivalConfidence: 'need-guidance',
        }}
      />,
    );

    expect(screen.getByText('Context: method train, confidence need-guidance')).toBeDefined();
  });
});
