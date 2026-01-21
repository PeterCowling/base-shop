"use client";

import type { ComponentProps } from "react";
import { useCallback } from "react";

import { Button } from "@/components/atoms/shadcn";

export type JumpLinkButtonProps = ComponentProps<typeof Button> & {
  targetId: string;
};

export function JumpLinkButton({
  targetId,
  onClick,
  type,
  ...props
}: JumpLinkButtonProps) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      const element = document.getElementById(targetId);
      if (element instanceof HTMLElement) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        if (typeof element.focus === "function") {
          element.focus({ preventScroll: true });
        }
      }
    },
    [onClick, targetId]
  );

  return (
    <Button type={type ?? "button"} onClick={handleClick} {...props} />
  );
}
