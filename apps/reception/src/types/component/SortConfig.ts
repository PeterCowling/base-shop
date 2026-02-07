// File: src/types/component/SortConfig.ts

/**
 * Represents the configuration for sorting table data.
 * @property {string} key - The identifier of the field to sort by.
 * @property {"asc" | "desc"} direction - The sort direction (ascending or descending).
 */
export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}
