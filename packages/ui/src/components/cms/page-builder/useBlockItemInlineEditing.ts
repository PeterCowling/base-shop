"use client";

import useInlineText from "./useInlineText";
import type { BlockItemProps } from "./BlockItem.types";

type Props = BlockItemProps;

export default function useBlockItemInlineEditing(component: Props["component"]) {
  const isInlineEditableButton = component.type === "Button";
  const inlineAll = useInlineText(component as any, "label") as ReturnType<
    typeof useInlineText<any, any>
  >;

  return {
    isInlineEditableButton,
    inline: isInlineEditableButton ? inlineAll : null,
  } as const;
}
