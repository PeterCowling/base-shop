/* File: /src/components/onboarding/OnboardingLayout.tsx */
import { FC, PropsWithChildren } from 'react';
import Image from 'next/image';
import ProgressBar from './ProgressBar';
import Container from '@/components/layout/Container';

export interface OnboardingLayoutProps extends PropsWithChildren {
  /** Current step the user is viewing, 1‑indexed */
  currentStep: number;
  /** Total number of steps in the onboarding flow */
  totalSteps: number;
  /** Optional heading shown above the step content */
  title?: string;
  /** If true, hide the progress bar **and** logo (e.g. full‑screen welcome image) */
  hideProgress?: boolean;
}

/**
 * OnboardingLayout
 * Shared page chrome (logo, heading, progress bar) for all onboarding steps.
 * Keeps visual context consistent and maintains user attention.
 *
 * When `hideProgress` is `true` (currently used on the Welcome screen), both the
 * progress bar **and** the hostel logo are suppressed so that the Welcome image
 * occupies the full vertical space without competing UI elements.
 */
const OnboardingLayout: FC<OnboardingLayoutProps> = ({
  currentStep,
  totalSteps,
  title,
  hideProgress,
  children,
}) => (
  <div className="flex min-h-svh w-full flex-col items-center bg-gray-50">
    <Container className="w-full max-w-md text-center">
      <header className="text-center">
        {/* Hide logo when hideProgress is true */}
        {!hideProgress && (
          <Image
            className="mx-auto block h-20 w-auto cursor-pointer object-contain"
            src="/hostel_brikette_logo_cb_white.jpg"
            alt="Hostel Brikette, Positano"
            width={240}
            height={80}
            priority
          />
        )}
        {title && (
          <h1 className="mb-2 text-2xl font-semibold text-gray-900">{title}</h1>
        )}
        {!hideProgress && (
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        )}
      </header>
    </Container>

    <Container className="flex w-full max-w-md flex-1 overflow-y-auto">
      <main className="w-full">
        {children}
      </main>
    </Container>
  </div>
);

export default OnboardingLayout;
