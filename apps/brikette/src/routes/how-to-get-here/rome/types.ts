export type Direction = "from-rome" | "to-rome";
export type Hub = "naples" | "salerno";
export type Mode = "bus-train" | "bus" | "ferry";

export interface Step {
  labelKey: string;
}

export interface RouteOption {
  id: string;
  direction: Direction;
  hub: Hub;
  mode: Mode;
  changes: number;
  titleKey: string;
  shortSummaryKey: string;
  notesKeys: string[];
  prosKeys: string[];
  consKeys: string[];
  steps: Step[];
  tagsKeys: string[];
}

export type PreferenceKey = "cheapest" | "scenic" | "heavy_luggage";

export interface Preference {
  key: PreferenceKey;
  labelKey: string;
  descriptionKey: string;
}

export interface ScoreResult {
  route: RouteOption;
  score: number;
  reasonKeys: string[];
}
