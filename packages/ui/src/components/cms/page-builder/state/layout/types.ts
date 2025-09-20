import type { PageComponent } from "@acme/types";
// Local copy to avoid package export mismatch
export type EditorFlags = {
  name?: string;
  locked?: boolean;
  zIndex?: number;
  hidden?: ("desktop" | "tablet" | "mobile")[];
  stackStrategy?: "default" | "reverse";
};

export type AddAction = {
  type: "add";
  component: PageComponent;
  parentId?: string;
  index?: number;
};

export type MoveAction = {
  type: "move";
  from: { parentId?: string; index: number };
  to: { parentId?: string; index: number };
};

export type RemoveAction = { type: "remove"; id: string };
export type DuplicateAction = { type: "duplicate"; id: string };
export type UpdateAction = {
  type: "update";
  id: string;
  patch: Partial<PageComponent>;
};

export type ResizeAction = {
  type: "resize";
  id: string;
  width?: string;
  height?: string;
  left?: string;
  top?: string;
  widthDesktop?: string;
  widthTablet?: string;
  widthMobile?: string;
  heightDesktop?: string;
  heightTablet?: string;
  heightMobile?: string;
  marginDesktop?: string;
  marginTablet?: string;
  marginMobile?: string;
  paddingDesktop?: string;
  paddingTablet?: string;
  paddingMobile?: string;
  [key: string]: string | undefined;
};

export type SetAction = { type: "set"; components: PageComponent[] };

export type ChangeAction =
  | AddAction
  | MoveAction
  | RemoveAction
  | DuplicateAction
  | UpdateAction
  | ResizeAction
  | SetAction;

export type UndoAction = { type: "undo" };
export type RedoAction = { type: "redo" };
export type SetGridColsAction = { type: "set-grid-cols"; gridCols: number };

export type UpdateEditorAction = {
  type: "update-editor";
  id: string;
  patch: Partial<EditorFlags>;
};

export type Action =
  | ChangeAction
  | UndoAction
  | RedoAction
  | SetGridColsAction
  | UpdateEditorAction;
