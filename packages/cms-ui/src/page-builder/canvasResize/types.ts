export type Handle = "se" | "ne" | "sw" | "nw" | "e" | "w" | "n" | "s";

export interface ResizeStartState {
  x: number;
  y: number;
  w: number;
  h: number;
  l: number;
  t: number;
  handle: Handle;
  ratio: number | null;
}

export interface ResizePatch {
  [key: string]: string;
}

export interface GuidesState {
  x: number | null;
  y: number | null;
}

export interface DistancesState {
  x: number | null;
  y: number | null;
}

