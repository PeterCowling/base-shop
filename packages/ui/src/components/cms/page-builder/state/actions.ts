import type { PageComponent } from "@acme/types";

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

export type Action =
  | ChangeAction
  | UndoAction
  | RedoAction
  | SetGridColsAction;
