import { useWizard } from "../WizardContext";
import type { WizardState } from "../schema";

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
    markStepComplete(stepId, v ? "complete" : "pending");
  };
  return [completed, setCompleted];
}

export default useStepCompletion;
