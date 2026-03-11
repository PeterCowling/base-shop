/* eslint-disable ds/no-hardcoded-copy -- BRIK-2145 [ttl=2026-12-31] English fallback copy for segmented booking prompts until locale bundles are added. */

type IntentAwareBookingCopyInput = {
  dormsLabel: string;
  privateBookingLabel: string;
};

type BookingCopyBranch = {
  heading: string;
  subcopy: string;
  primaryLabel: string;
  secondaryLabel: string;
};

export type IntentAwareBookingCopy = {
  chooser: BookingCopyBranch;
  direct: {
    hostel: BookingCopyBranch;
    private: BookingCopyBranch;
  };
};

export function buildIntentAwareBookingCopy(
  input: IntentAwareBookingCopyInput,
): IntentAwareBookingCopy {
  const { dormsLabel, privateBookingLabel } = input;

  return {
    chooser: {
      heading: "Choose your stay",
      subcopy: "Pick the right booking path now so we keep you in the right funnel.",
      primaryLabel: dormsLabel,
      secondaryLabel: privateBookingLabel,
    },
    direct: {
      hostel: {
        heading: "Continue with dorm booking",
        subcopy: "Stay on the dorm route and keep direct-booking perks applied.",
        primaryLabel: dormsLabel,
        secondaryLabel: privateBookingLabel,
      },
      private: {
        heading: "Continue with private rooms",
        subcopy: "Stay on the private-room route and keep the quieter stay flow selected.",
        primaryLabel: privateBookingLabel,
        secondaryLabel: dormsLabel,
      },
    },
  };
}
