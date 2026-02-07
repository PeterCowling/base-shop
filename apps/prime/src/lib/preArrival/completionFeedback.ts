import type { ChecklistProgress } from '../../types/preArrival';

export const LAST_COMPLETED_CHECKLIST_ITEM_STORAGE_KEY = 'prime_last_completed_checklist_item';

export function readLastCompletedChecklistItem(
  storage: Pick<Storage, 'getItem'> = localStorage,
): keyof ChecklistProgress | null {
  const value = storage.getItem(LAST_COMPLETED_CHECKLIST_ITEM_STORAGE_KEY);
  if (
    value === 'routePlanned' ||
    value === 'etaConfirmed' ||
    value === 'cashPrepared' ||
    value === 'rulesReviewed' ||
    value === 'locationSaved'
  ) {
    return value;
  }

  return null;
}

export function writeLastCompletedChecklistItem(
  item: keyof ChecklistProgress,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  storage.setItem(LAST_COMPLETED_CHECKLIST_ITEM_STORAGE_KEY, item);
}

export function getChecklistItemLabel(item: keyof ChecklistProgress): string {
  if (item === 'routePlanned') return 'Route planned';
  if (item === 'etaConfirmed') return 'ETA confirmed';
  if (item === 'cashPrepared') return 'Cash prepared';
  if (item === 'rulesReviewed') return 'Rules reviewed';
  return 'Location saved';
}
