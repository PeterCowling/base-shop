// Single-purpose: shared types and canvas constants for preview image generators

export type Size = { w: number; h: number };
export type Colors = { bg: string; stroke: string; fill: string; overlay: string };

// 16:9 thumbnail canvas
export const CANVAS: Size = { w: 400, h: 225 };

