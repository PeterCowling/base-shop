export type PipelineStage = "P" | "M" | "S" | "K" | "L";

export type PipelineMapNode = {
  stage: PipelineStage;
  href: string;
  x: number;
  y: number;
};

export const PIPELINE_MAP_NODES: PipelineMapNode[] = [
  { stage: "P", href: "/leads/triage", x: 14, y: 68 },
  { stage: "M", href: "/candidates", x: 36, y: 30 },
  { stage: "S", href: "/candidates", x: 56, y: 62 },
  { stage: "K", href: "/scenario-lab", x: 78, y: 26 },
  { stage: "L", href: "/launches", x: 90, y: 70 },
];

export const PIPELINE_MAP_CONNECTIONS: Array<[PipelineStage, PipelineStage]> = [
  ["P", "M"],
  ["M", "S"],
  ["S", "K"],
  ["K", "L"],
];

export function normalizeCount(value: number | undefined): number {
  if (!value || value < 0) return 0;
  return value;
}

export function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function tokenCountForStage(count: number): number {
  if (count <= 0) return 0;
  if (count <= 3) return count;
  return Math.min(12, Math.ceil(Math.sqrt(count)));
}
