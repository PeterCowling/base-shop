/* src/types/hooks/data/preorderData.ts */

/**
 * Represents an occupant’s meal or beverage preorder for a single night.
 *
 * Example:
 *   breakfast: "PREPAID MP A",   // The occupant’s breakfast eligibility (e.g., "PREPAID MP A" or "NA")
 *   drink1: "PREPAID MP A",      // The occupant’s eligibility for the first drink.
 *   drink2: "NA"                 // The occupant’s eligibility for the second drink.
 */
export interface PreorderEntry {
  breakfast: string;
  drink1: string;
  drink2: string;
}

/**
 * A map of nightKey -> PreorderEntry.
 *
 *   "night1": {
 *     breakfast: "PREPAID MP A",
 *     drink1: "PREPAID MP A",
 *     drink2: "NA"
 *   }
 */
export interface PreorderData {
  [nightKey: string]: PreorderEntry;
}

/**
 * Represents the complete "preorder" node stored in Firebase.
 *
 *   "preorder": {
 *     "<occupant_id>": {
 *       "<night_key>": {
 *         breakfast: "<string>",
 *         drink1: "<string>",
 *         drink2: "<string>"
 *       }
 *     }
 *   }
 *
 * - occupant_id (string): Unique identifier for the occupant (e.g., occ_1741690203417).
 * - night_key (string): A label for each night of the occupant's stay (e.g., "night1", "night2").
 */
export type PreorderState = Record<string, PreorderData> | null;
