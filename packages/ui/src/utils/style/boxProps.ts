import type { CSSProperties } from "react";

export interface BoxOptions {
  width?: string | number;
  height?: string | number;
  padding?: string;
  margin?: string;
}

const widthUtilityPrefixes = ["w-", "min-w-", "max-w-", "size-"];
const heightUtilityPrefixes = ["h-", "min-h-", "max-h-"];

function isUtilityToken(value: unknown, prefixes: string[]): value is string {
  if (typeof value !== "string") {
    return false;
  }

  return prefixes.some((prefix) => value.startsWith(prefix) || value.includes(`:${prefix}`));
}

function assignDimension(
  value: string | number | undefined,
  key: "width" | "height",
  prefixes: string[],
  classes: string[],
  style: CSSProperties,
) {
  if (value === undefined) {
    return;
  }

  if (typeof value === "number") {
    style[key] = value;
    return;
  }

  if (isUtilityToken(value, prefixes)) {
    classes.push(value);
    return;
  }

  style[key] = value;
}

export function boxProps({ width, height, padding, margin }: BoxOptions) {
  const classes: string[] = [];
  const style: CSSProperties = {};

  assignDimension(width, "width", widthUtilityPrefixes, classes, style);
  assignDimension(height, "height", heightUtilityPrefixes, classes, style);

  if (padding) {
    classes.push(padding);
  }
  if (margin) {
    classes.push(margin);
  }

  return { classes: classes.join(" "), style };
}
