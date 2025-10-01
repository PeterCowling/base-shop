import * as React from "react";
export interface BoxOptions {
  width?: string | number;
  height?: string | number;
  padding?: string;
  margin?: string;
}

const utilityPrefixes = {
  width: "w-",
  height: "h-",
} as const;

function isUtilityClass(dimension: "width" | "height", value: string) {
  const prefix = utilityPrefixes[dimension];
  return value.startsWith(prefix) || value.includes(`:${prefix}`);
}

function applyDimension(
  dimension: "width" | "height",
  value: string | number | undefined,
  classes: string[],
  style: React.CSSProperties,
) {
  if (value === undefined) {
    return;
  }

  if (typeof value === "number") {
    style[dimension] = value;
    return;
  }

  if (isUtilityClass(dimension, value)) {
    classes.push(value);
    return;
  }

  style[dimension] = value;
}

export function boxProps({ width, height, padding, margin }: BoxOptions) {
  const classes: string[] = [];
  const style: React.CSSProperties = {};

  applyDimension("width", width, classes, style);
  applyDimension("height", height, classes, style);

  if (padding) {
    classes.push(padding);
  }
  if (margin) {
    classes.push(margin);
  }

  return { classes: classes.join(" "), style };
}
