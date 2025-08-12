import { useConfigurator } from "../ConfiguratorContext";
import type { WizardState } from "../../wizard/schema";

type Validator = (state: WizardState) => boolean;

const validators: Record<string, Validator> = {
  "shop-details": (s) => Boolean(s.shopId && s.storeName),
  theme: (s) => Boolean(s.theme),
};

export function useStepCompletion(stepId: string): [boolean, (v: boolean) => void] {
  const { state, markStepComplete } = useConfigurator();
  const validate = validators[stepId] ?? (() => true);
  const completed = state.completed[stepId] === "complete" && validate(state);
  const setCompleted = (v: boolean) => {
    if (v && !validate(state)) return;
    markStepComplete(stepId, v ? "complete" : "pending");
  };
  return [completed, setCompleted];
}

export default useStepCompletion;
