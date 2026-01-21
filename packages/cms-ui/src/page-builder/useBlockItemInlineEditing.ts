"use client";

import type { BlockItemProps } from "./BlockItem.types";
import useInlineText from "./useInlineText";

type Props = BlockItemProps;

export default function useBlockItemInlineEditing(component: Props["component"]) {
  const isInlineEditableButton = component.type === "Button";
  const inlineAll = useInlineText<{ label?: string }, "label">(
    component as unknown as { label?: string },
    "label"
  );

  return {
    isInlineEditableButton,
    inline: isInlineEditableButton ? inlineAll : null,
  } as const;
}
