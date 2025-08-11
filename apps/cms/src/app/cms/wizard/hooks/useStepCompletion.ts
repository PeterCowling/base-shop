import { useWizard } from "../WizardContext";
import type { StepStatus, WizardState } from "../schema";

type Validator = (state: WizardState) => boolean;

const validators: Record<string, Validator> = {
  "shop-details": (s) => Boolean(s.shopId && s.storeName),
  theme: (s) => Boolean(s.theme),
};

export function useStepCompletion(stepId: string): [boolean, (v: boolean) => void] {
  const { state, markStepComplete } = useWizard();
  const validate = validators[stepId] ?? (() => true);
  const completed = state.completed[stepId] === "complete" && validate(state);
  const setCompleted = (v: boolean) => {
    if (v && !validate(state)) return;
    const status: StepStatus = v ? "complete" : "pending";
    markStepComplete(stepId, status);
  };
  return [completed, setCompleted];
}

export default useStepCompletion;
