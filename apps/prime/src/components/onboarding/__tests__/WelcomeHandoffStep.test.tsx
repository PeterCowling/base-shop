import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import WelcomeHandoffStep from '../WelcomeHandoffStep';

// Mock hooks
const mockCompleteTask = jest.fn().mockResolvedValue(undefined);

jest.mock('../../../hooks/mutator/useCompletedTaskMutator', () => ({
  useCompletedTaskMutator: () => ({ completeTask: mockCompleteTask }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (opts?.name) return `${key} ${opts.name}`;
      return key;
    },
  }),
}));

jest.mock('@acme/design-system/primitives', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../OnboardingLayout', () => ({
  __esModule: true,
  default: ({ children, hideProgress }: any) => (
    <div data-testid="onboarding-layout" data-hide-progress={hideProgress}>
      {children}
    </div>
  ),
}));

describe('WelcomeHandoffStep', () => {
  const onContinue = jest.fn();
  const defaultProps = { onContinue, bookingId: 'booking_123' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the welcome title with guest name', () => {
    render(<WelcomeHandoffStep {...defaultProps} guestName="Marco" />);

    expect(screen.getByText('handoff.title Marco')).toBeDefined();
  });

  it('renders highlight items', () => {
    render(<WelcomeHandoffStep {...defaultProps} />);

    expect(screen.getByText('handoff.highlights.explore.title')).toBeDefined();
    expect(screen.getByText('handoff.highlights.connect.title')).toBeDefined();
    expect(screen.getByText('handoff.highlights.quests.title')).toBeDefined();
  });

  it('renders the CTA button', () => {
    render(<WelcomeHandoffStep {...defaultProps} />);

    expect(screen.getByText('handoff.cta')).toBeDefined();
  });

  it('hides progress bar and logo in layout', () => {
    render(<WelcomeHandoffStep {...defaultProps} />);

    // OnboardingLayout hides logo and progress when hideProgress=true
    expect(screen.queryByAltText('Hostel Brikette, Positano')).toBeNull();
  });

  it('marks onboardingHandoffComplete and calls onContinue on CTA click', async () => {
    render(<WelcomeHandoffStep {...defaultProps} />);

    fireEvent.click(screen.getByText('handoff.cta'));

    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalledWith('onboardingHandoffComplete', true);
      expect(onContinue).toHaveBeenCalled();
    });
  });

  it('calls onContinue even when completeTask fails', async () => {
    mockCompleteTask.mockRejectedValueOnce(new Error('network error'));

    render(<WelcomeHandoffStep {...defaultProps} />);

    fireEvent.click(screen.getByText('handoff.cta'));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalled();
    });
  });

  it('disables CTA while submitting', async () => {
    // Make completeTask hang to test disabled state
    let resolveTask: () => void;
    mockCompleteTask.mockImplementationOnce(
      () => new Promise<void>((resolve) => { resolveTask = resolve; }),
    );

    render(<WelcomeHandoffStep {...defaultProps} />);

    const button = screen.getByText('handoff.cta');
    fireEvent.click(button);

    // Button should be disabled while submitting
    expect(button).toBeDisabled();

    // Resolve and verify it re-enables
    resolveTask!();
    await waitFor(() => {
      expect(onContinue).toHaveBeenCalled();
    });
  });
});
