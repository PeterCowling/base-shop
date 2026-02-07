import { render, screen, waitFor } from '@testing-library/react';
import GuestEntryPage from '../page';

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'token' ? 'valid-token' : null),
  }),
}));

describe('Guest entry trust cues', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('TC-01: trust cue blocks render on verification screen', async () => {
    render(<GuestEntryPage />);

    await waitFor(() => {
      expect(screen.getByText('Confirm your stay')).toBeDefined();
    });

    expect(
      screen.getByText('Why this helps: this quick check unlocks your guest tools and speeds up reception handoff.'),
    ).toBeDefined();
    expect(
      screen.getByText('Privacy: we only use this information for your current stay.'),
    ).toBeDefined();
  });
});
