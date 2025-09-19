"use client";

import type { Locale } from "@acme/i18n/locales";
import type { PageComponent, TextComponent, HistoryState } from "@acme/types";
import { memo } from "react";
import type { Action } from "./state";
import TextBlock from "./TextBlock";
import BlockItem from "./BlockItem";
import type { DevicePreset } from "../../../utils/devicePresets";

type Props = {
  component: PageComponent;
  index: number;
  parentId: string | undefined;
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
