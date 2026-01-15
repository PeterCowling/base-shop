import { useTillShiftContext } from "./TillShiftProvider";

export function useTillUIControls() {
  const till = useTillShiftContext();
  return {
    showOpenShiftForm: till.showOpenShiftForm,
    setShowOpenShiftForm: till.setShowOpenShiftForm,
    showCloseShiftForm: till.showCloseShiftForm,
    setShowCloseShiftForm: till.setShowCloseShiftForm,
    closeShiftFormVariant: till.closeShiftFormVariant,
    setCloseShiftFormVariant: till.setCloseShiftFormVariant,
    showKeycardCountForm: till.showKeycardCountForm,
    setShowKeycardCountForm: till.setShowKeycardCountForm,
  } as const;
}
