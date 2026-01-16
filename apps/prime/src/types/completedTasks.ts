// /src/types/completedTasks.ts

/**
 * The entire "completedTasks" node in Firebase:
 * occupant_id => OccupantCompletedTasks
 *
 * occupant_id is typically something like "occ_1741690203417".
 */
import type { IndexedById } from './indexedById';

/**
 * Task fields are stored as strings "true" or "false" in Firebase.
 * We define them as optional to allow partial or additional tasks if needed.
 *
 * Example occupant-level tasks:
 * {
 *   bagStorage: "false",
 *   complimentaryBreakfast: "false",
 *   mainDoorAccess: "true",
 *   ...
 * }
 */
export interface OccupantCompletedTasks {
  bagStorage?: 'true' | 'false';
  complimentaryBreakfast?: 'true' | 'false';
  complimentaryEveningDrink?: 'true' | 'false';
  digitalAssistant?: 'true' | 'false';
  hero?: 'true' | 'false';
  mainDoorAccess?: 'true' | 'false';
  [key: string]: 'true' | 'false' | undefined;
}

export type CompletedTasks = IndexedById<OccupantCompletedTasks>;
