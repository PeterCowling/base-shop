export type PrepaymentProvider = "octorate" | "hostelworld";
export type PrepaymentStep = "first" | "second" | "third" | "success";

export type PrepaymentAction =
  | "prepayment_chase_1"
  | "prepayment_chase_2"
  | "prepayment_chase_3";

export interface PrepaymentTemplateSelection {
  subject: string;
  provider?: PrepaymentProvider | "standard";
}

export interface PrepaymentActivity {
  code: number;
  description: string;
}

export interface PrepaymentWorkflowDetails {
  step: PrepaymentStep;
  template: PrepaymentTemplateSelection;
  activity: PrepaymentActivity;
}

const PREPAYMENT_SUBJECTS = {
  first: {
    octorate: "Prepayment - 1st Attempt Failed (Octorate)",
    hostelworld: "Prepayment - 1st Attempt Failed (Hostelworld)",
  },
  second: "Prepayment - 2nd Attempt Failed",
  third: "Prepayment - Cancelled post 3rd Attempt",
  success: "Prepayment Successful",
} as const;

export function prepaymentStepFromAction(
  action: PrepaymentAction
): PrepaymentStep {
  if (action === "prepayment_chase_1") return "first";
  if (action === "prepayment_chase_2") return "second";
  return "third";
}

export function selectPrepaymentTemplate({
  step,
  provider,
}: {
  step: PrepaymentStep;
  provider?: PrepaymentProvider;
}): PrepaymentTemplateSelection {
  if (step === "first") {
    const resolvedProvider = provider ?? "octorate";
    return {
      subject: PREPAYMENT_SUBJECTS.first[resolvedProvider],
      provider: resolvedProvider,
    };
  }

  if (step === "second") {
    return { subject: PREPAYMENT_SUBJECTS.second, provider: "standard" };
  }

  if (step === "third") {
    return { subject: PREPAYMENT_SUBJECTS.third, provider: "standard" };
  }

  return { subject: PREPAYMENT_SUBJECTS.success, provider: "standard" };
}

export function getPrepaymentActivity(step: PrepaymentStep): PrepaymentActivity {
  switch (step) {
    case "first":
      return { code: 2, description: "First reminder to agree to terms" };
    case "second":
      return { code: 3, description: "Second reminder to agree to terms" };
    case "third":
      return { code: 4, description: "Booking cancelled due to no agreement" };
    case "success":
      return { code: 21, description: "Guest has accepted Non-Refundable T&Cs" };
    default: {
      const unreachable: never = step;
      return { code: 0, description: `Unknown prepayment step: ${unreachable}` };
    }
  }
}

export function buildPrepaymentActivityLog({
  bookingRef,
  step,
  actor,
}: {
  bookingRef: string;
  step: PrepaymentStep;
  actor: string;
}): { bookingRef: string; code: number; description: string; actor: string } {
  const activity = getPrepaymentActivity(step);
  return {
    bookingRef,
    code: activity.code,
    description: activity.description,
    actor,
  };
}

export function resolvePrepaymentWorkflow({
  step,
  provider,
}: {
  step: PrepaymentStep;
  provider?: PrepaymentProvider;
}): PrepaymentWorkflowDetails {
  return {
    step,
    template: selectPrepaymentTemplate({ step, provider }),
    activity: getPrepaymentActivity(step),
  };
}
