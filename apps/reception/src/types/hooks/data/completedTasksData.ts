/* src/types/hooks/data/completedTasksData.ts */

// Centralized enum of all possible completed task fields
export enum CompletedTaskField {
  BAG_STORAGE = "bagStorage",
  COMPLIMENTARY_BREAKFAST = "complimentaryBreakfast",
  COMPLIMENTARY_EVENING_DRINK = "complimentaryEveningDrink",
  DIGITAL_ASSISTANT = "digitalAssistant",
  HERO = "hero",
  MAIN_DOOR_ACCESS = "mainDoorAccess",
}

/**
 * Represents the "true" or "false" status of each completed task.
 */
export interface CompletedTaskFlags {
  bagStorage: "true" | "false";
  complimentaryBreakfast: "true" | "false";
  complimentaryEveningDrink: "true" | "false";
  digitalAssistant: "true" | "false";
  hero: "true" | "false";
  mainDoorAccess: "true" | "false";
}

/**
 * The entire "completedTasks" node, keyed by occupantId -> CompletedTaskFlags.
 *
 * Example:
 * {
 *   "occ_1741690203417": {
 *     bagStorage: "false",
 *     complimentaryBreakfast: "false",
 *     ...
 *   }
 * }
 */
export type CompletedTasks = Record<string, CompletedTaskFlags> | null;
