export type PrimitiveRadius =
  | "none"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "full";

export type PrimitiveShape = "square" | "soft" | "pill";

const RADIUS_CLASS_BY_VALUE: Record<PrimitiveRadius, string> = {
  none: "rounded-none",
  xs: "rounded-xs",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  "4xl": "rounded-4xl",
  full: "rounded-full",
};

const SHAPE_TO_RADIUS: Record<PrimitiveShape, PrimitiveRadius> = {
  square: "none",
  soft: "md",
  pill: "full",
};

export function resolveShapeRadiusClass({
  shape,
  radius,
  defaultRadius,
}: {
  shape?: PrimitiveShape;
  radius?: PrimitiveRadius;
  defaultRadius: PrimitiveRadius;
}): string {
  const resolved = radius ?? (shape ? SHAPE_TO_RADIUS[shape] : defaultRadius);
  return RADIUS_CLASS_BY_VALUE[resolved];
}
