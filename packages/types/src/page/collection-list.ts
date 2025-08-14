import type { PageComponentBase } from "./base";

/** Grid of collections; `minItems`/`maxItems` clamp visible collections */
export interface CollectionListComponent extends PageComponentBase {
  type: "CollectionList";
  collections?: { id: string; title: string; image: string }[];
  desktopItems?: number;
  tabletItems?: number;
  mobileItems?: number;
}
