export type Viewport = "desktop" | "tablet" | "mobile";
export type EditorMap =
  | Record<string, { name?: string; locked?: boolean; zIndex?: number; hidden?: Viewport[] }>
  | undefined;

