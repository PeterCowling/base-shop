import { useWizard } from "../WizardContext";

export function useStepCompletion(stepId: string): [boolean, (v: boolean) => void] {
  const { state, update } = useWizard();
  const completed = state.completed[stepId] ?? false;
  const setCompleted = (v: boolean) => {
    update("completed", { ...state.completed, [stepId]: v });
  };
  return [completed, setCompleted];
}

export default useStepCompletion;
