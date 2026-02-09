import { render, screen } from '@testing-library/react';

import { readActivationFunnelEvents } from '../../../lib/analytics/activationFunnel';
import ActivationFunnelSummary from '../ActivationFunnelSummary';

jest.mock('../../../lib/analytics/activationFunnel', () => {
  const actual = jest.requireActual('../../../lib/analytics/activationFunnel');
  return {
    ...actual,
    readActivationFunnelEvents: jest.fn(),
  };
});

describe('ActivationFunnelSummary', () => {
  const mockedReadActivationFunnelEvents = readActivationFunnelEvents as jest.MockedFunction<
    typeof readActivationFunnelEvents
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders conversion metrics and weekly trend data', () => {
    mockedReadActivationFunnelEvents.mockReturnValue([
      { type: 'lookup_success', sessionKey: 'a', ts: Date.parse('2026-02-01T10:00:00Z') },
      { type: 'verify_success', sessionKey: 'a', ts: Date.parse('2026-02-01T10:01:00Z') },
      { type: 'guided_step_complete', sessionKey: 'a', ts: Date.parse('2026-02-01T10:02:00Z') },
    ]);

    render(<ActivationFunnelSummary />);

    expect(screen.getByText('Activation funnel')).toBeInTheDocument();
    expect(screen.getByText('Lookup success')).toBeInTheDocument();
    expect(screen.getByText('Utility actions used')).toBeInTheDocument();
    expect(screen.getByText('Weekly trend')).toBeInTheDocument();
    expect(screen.getByText(/ready/)).toBeInTheDocument();
  });
});
