import { useTillShiftContext } from "./TillShiftProvider";

export function useTillShiftActions() {
  const till = useTillShiftContext();
  return {
    handleOpenShiftClick: till.handleOpenShiftClick,
    confirmShiftOpen: till.confirmShiftOpen,
    handleCloseShiftClick: till.handleCloseShiftClick,
    confirmShiftClose: till.confirmShiftClose,
    handleKeycardCountClick: till.handleKeycardCountClick,
    confirmKeycardReconcile: till.confirmKeycardReconcile,
    addKeycardsFromSafe: till.addKeycardsFromSafe,
    returnKeycardsToSafe: till.returnKeycardsToSafe,
  } as const;
}
