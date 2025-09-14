import type { HistoryState } from "@acme/types";
import type { ResizeAction } from "./types";
import { commit } from "../history";
import { resizeComponent } from "./utils";

export function resize(state: HistoryState, action: ResizeAction): HistoryState {
  const normalize = (v?: string) => {
    if (v === undefined) return undefined;
    const trimmed = v.trim();
    if (trimmed === "") return undefined;
    const num = Number(trimmed);
    return !Number.isNaN(num) && String(num) === trimmed
      ? `${trimmed}px`
      : trimmed;
  };
  const patch: {
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
  } = {};
  const width = normalize(action.width);
  const height = normalize(action.height);
  const left = normalize(action.left);
  const top = normalize(action.top);
  const widthDesktop = normalize(action.widthDesktop);
  const widthTablet = normalize(action.widthTablet);
  const widthMobile = normalize(action.widthMobile);
  const heightDesktop = normalize(action.heightDesktop);
  const heightTablet = normalize(action.heightTablet);
  const heightMobile = normalize(action.heightMobile);
  const marginDesktop = normalize(action.marginDesktop);
  const marginTablet = normalize(action.marginTablet);
  const marginMobile = normalize(action.marginMobile);
  const paddingDesktop = normalize(action.paddingDesktop);
  const paddingTablet = normalize(action.paddingTablet);
  const paddingMobile = normalize(action.paddingMobile);
  if (width !== undefined) patch.width = width;
  if (height !== undefined) patch.height = height;
  if (left !== undefined) patch.left = left;
  if (top !== undefined) patch.top = top;
  if (widthDesktop !== undefined) patch.widthDesktop = widthDesktop;
  if (widthTablet !== undefined) patch.widthTablet = widthTablet;
  if (widthMobile !== undefined) patch.widthMobile = widthMobile;
  if (heightDesktop !== undefined) patch.heightDesktop = heightDesktop;
  if (heightTablet !== undefined) patch.heightTablet = heightTablet;
  if (heightMobile !== undefined) patch.heightMobile = heightMobile;
  if (marginDesktop !== undefined) patch.marginDesktop = marginDesktop;
  if (marginTablet !== undefined) patch.marginTablet = marginTablet;
  if (marginMobile !== undefined) patch.marginMobile = marginMobile;
  if (paddingDesktop !== undefined) patch.paddingDesktop = paddingDesktop;
  if (paddingTablet !== undefined) patch.paddingTablet = paddingTablet;
  if (paddingMobile !== undefined) patch.paddingMobile = paddingMobile;
  return commit(state, resizeComponent(state.present, action.id, patch));
}
