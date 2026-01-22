import { hashSeed as libHashSeed, SeededRandom } from "@acme/lib";

export type PipelineStage = "P" | "M" | "S" | "K" | "L";

export type PipelineMapNode = {
  stage: PipelineStage;
  label: string;
  href: string;
  x: number;
  y: number;
};

export const PIPELINE_MAP_NODES: PipelineMapNode[] = [
  { stage: "P", label: "Gate Scan", href: "/leads/triage", x: 14, y: 68 },
  { stage: "M", label: "Market Sweep", href: "/candidates", x: 36, y: 30 },
  { stage: "S", label: "Safety Shield", href: "/candidates", x: 56, y: 62 },
  { stage: "K", label: "Capital Run", href: "/scenario-lab", x: 78, y: 26 },
  { stage: "L", label: "Mission Log", href: "/launches", x: 90, y: 70 },
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

/**
 * Hash a string to a numeric seed for deterministic random generation.
 * @see hashSeed from @acme/lib/math/random
 */
export function hashSeed(input: string): number {
  return libHashSeed(input);
}

/**
 * Create a deterministic random number generator from a seed.
 * Returns a function that produces values in [0, 1) with each call.
 * @see SeededRandom from @acme/lib/math/random
 */
export function lcg(seed: number): () => number {
  const rng = new SeededRandom(seed);
  return () => rng.next();
}

export function tokenCountForStage(count: number): number {
  if (count <= 0) return 0;
  if (count <= 3) return count;
  return Math.min(12, Math.ceil(Math.sqrt(count)));
}
