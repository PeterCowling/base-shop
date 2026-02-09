/* File: /src/components/onboarding/OnboardingLayout.tsx */
import { type FC, type PropsWithChildren } from 'react';

import ProgressBar from './ProgressBar';

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
  <div className="flex flex-col items-center min-h-screen w-full bg-[#f9f9f9]">
    <header className="w-full max-w-[400px] mt-0 mb-0 text-center">
      {/* Hide logo when hideProgress is true */}
      {!hideProgress && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="h-[80px] w-auto object-contain cursor-pointer mx-auto block"
            src="/hostel_brikette_logo_cb_white.jpg"
            alt="Hostel Brikette, Positano"
          />
        </>
      )}
      {title && (
        <h1 className="text-2xl font-semibold text-[#333] mb-2">{title}</h1>
      )}
      {!hideProgress && (
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      )}
    </header>

    <main className="flex-1 w-full max-w-[400px] overflow-y-auto">
      {children}
    </main>
  </div>
);

export default OnboardingLayout;
