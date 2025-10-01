import * as React from "react";
export interface BoxOptions {
  width?: string | number;
  height?: string | number;
  padding?: string;
  margin?: string;
}

export function boxProps({ width, height, padding, margin }: BoxOptions) {
  const classes: string[] = [];
  const style: React.CSSProperties = {};

  if (width !== undefined) {
    if (typeof width === "string" && (width.startsWith("w-") || width.includes(":w-"))) {
      classes.push(width);
    } else if (typeof width === "number") {
      style.width = `${width}px`;
    } else {
      style.width = width;
    }
  }

  if (height !== undefined) {
    if (typeof height === "string" && (height.startsWith("h-") || height.includes(":h-"))) {
      classes.push(height);
    } else if (typeof height === "number") {
      style.height = `${height}px`;
    } else {
      style.height = height;
    }
  }

  if (padding) {
    classes.push(padding);
  }
  if (margin) {
    classes.push(margin);
  }

  return { classes: classes.join(" "), style };
}
