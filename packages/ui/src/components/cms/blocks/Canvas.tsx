import React from "react";

interface Props {
  /** Background color for the canvas area (e.g. #ffffff or rgb()/var()). */
  color?: string;
}

/**
 * Canvas (layout)
 *
 * Acts as a page-sized background surface. It stretches to fill the
 * editor's selected device width and takes full available height. The
 * background color is authorable by the user.
 */
export default function Canvas({ color }: Props) {
  return (
    <div
      className="w-full h-full"
      // eslint-disable-next-line react/forbid-dom-props -- DX-1234 dynamic authorable background color
      style={{ backgroundColor: color ?? "transparent" }}
      aria-label="Canvas"
    />
  );
}
