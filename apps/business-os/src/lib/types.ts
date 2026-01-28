/**
 * Business OS entity types
 *
 * Based on docs/AGENTS.docs.md section 3.1.5
 */

// Business catalog types
export interface Business {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: "active" | "inactive" | "archived";
  created: string;
  tags: string[];
}

export interface BusinessCatalog {
  businesses: Business[];
  metadata: {
    version: string;
    lastUpdated: string;
    format: string;
  };
}

// Lane types
export type Lane =
  | "Inbox"
  | "Fact-finding"
  | "Planned"
  | "In progress"
  | "Blocked"
  | "Done"
  | "Reflected";

// Priority types
export type Priority = "P0" | "P1" | "P2" | "P3" | "P4" | "P5";

// Card frontmatter
export interface CardFrontmatter {
  Type: "Card";
  Lane: Lane;
  Priority: Priority;
  Owner: string;
  ID: string;
  Title?: string;
  "Proposed-Lane"?: Lane;
  Business?: string;
  Tags?: string[];
  Dependencies?: string[];
  "Due-Date"?: string;
  Created?: string;
  Updated?: string;
}

// Card with parsed content
export interface Card extends CardFrontmatter {
  content: string;
  filePath: string;
}

// Idea frontmatter
export interface IdeaFrontmatter {
  Type: "Idea" | "Opportunity";
  ID?: string;
  Business?: string;
  Status?: "raw" | "worked" | "converted" | "dropped";
  "Created-Date"?: string;
  Tags?: string[];
}

// Idea with parsed content
export interface Idea extends IdeaFrontmatter {
  content: string;
  filePath: string;
}

// Stage document types
export type StageType = "fact-find" | "plan" | "build" | "reflect";

export interface StageFrontmatter {
  Type: "Stage";
  Stage: StageType;
  "Card-ID": string;
  Created?: string;
  Updated?: string;
}

export interface StageDoc extends StageFrontmatter {
  content: string;
  filePath: string;
}

// Evidence source types (from plan section 14)
export type EvidenceSource =
  | "measurement"
  | "customer-input"
  | "repo-diff"
  | "experiment"
  | "financial-model"
  | "vendor-quote"
  | "legal"
  | "assumption"
  | "other";

// Query filters
export interface CardQuery {
  business?: string;
  lane?: Lane;
  priority?: Priority;
  owner?: string;
  tags?: string[];
  includeArchived?: boolean;
}

export interface IdeaQuery {
  business?: string;
  status?: "raw" | "worked" | "converted" | "dropped";
  location?: "inbox" | "worked";
  includeArchived?: boolean;
}
