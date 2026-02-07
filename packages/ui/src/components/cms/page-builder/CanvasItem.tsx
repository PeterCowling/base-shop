"use client";

import { memo } from "react";

import type { Locale } from "@acme/i18n/locales";
import type { HistoryState,PageComponent, TextComponent } from "@acme/types";

import type { DevicePreset } from "../../../utils/devicePresets";

import BlockItem from "./BlockItem";
import type { Action } from "./state";
import TextBlock from "./TextBlock";

type Props = {
  component: PageComponent;
  index: number;
  parentId: string | undefined;
  parentType?: string;
  parentSlots?: number;
  selectedIds: string[];
  onSelect: (id: string, e?: React.MouseEvent) => void;
  onRemove: () => void;
  dispatch: React.Dispatch<Action>;
  locale: Locale;
  gridEnabled?: boolean;
  gridCols: number;
  viewport: "desktop" | "tablet" | "mobile";
  device?: DevicePreset;
  editor?: HistoryState["editor"];
  zoom?: number;
  baselineSnap?: boolean;
  baselineStep?: number;
  dropAllowed?: boolean | null;
  insertParentId?: string | undefined;
  insertIndex?: number | null;
  preferParentOnClick?: boolean;
};

const CanvasItem = memo(function CanvasItemComponent(props: Props) {
  if (props.component.type === "Text") {
    return (
      <TextBlock
        {...props}
        component={props.component as TextComponent}
      />
    );
  }

  return <BlockItem {...props} />;
});

export type { Props as CanvasItemProps };
export default CanvasItem;
