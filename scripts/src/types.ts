export interface ShopMetadata {
  /** ISO timestamp of last upgrade */
  lastUpgrade?: string;
  /** Map of component package versions at upgrade time */
  componentVersions?: Record<string, string>;
  [key: string]: unknown;
}

export interface PageComponent {
  type: string;
  [key: string]: unknown;
}

export interface PageRecord {
  id: string;
  components?: PageComponent[];
  [key: string]: unknown;
}
