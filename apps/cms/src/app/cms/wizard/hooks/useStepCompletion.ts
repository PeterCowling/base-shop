import { useWizard } from "../WizardContext";

export function useStepCompletion(stepId: string): [boolean, (v: boolean) => void] {
  const { state, markStepComplete } = useWizard();
  const completed = state.completed[stepId] ?? false;
  const setCompleted = (v: boolean) => {
    markStepComplete(stepId, v);
  };
  return [completed, setCompleted];
}

export default useStepCompletion;
