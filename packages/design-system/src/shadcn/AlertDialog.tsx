import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../primitives/dialog";
import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
import { cn } from "../utils/style";

export const AlertDialog = Dialog;
export const AlertDialogTrigger = DialogTrigger;
export const AlertDialogPortal = DialogPortal;
export const AlertDialogOverlay = DialogOverlay;
export const AlertDialogContent = DialogContent;
export const AlertDialogHeader = DialogHeader;
export const AlertDialogFooter = DialogFooter;
export const AlertDialogTitle = DialogTitle;
export const AlertDialogDescription = DialogDescription;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Semantic action shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit radius token override. */
  radius?: PrimitiveRadius;
};

export const AlertDialogAction = (
  {
    ref,
    className,
    shape,
    radius,
    ...props
  }: ButtonProps & {
    ref?: React.Ref<HTMLButtonElement>;
  }
) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "md",
  });
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex items-center justify-center border border-transparent bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        shapeRadiusClass,
        className,
      )} // i18n-exempt -- DEV-000: UI utility classes
      {...props}
    />
  );
};

export const AlertDialogCancel = (
  {
    ref,
    className,
    shape,
    radius,
    ...props
  }: ButtonProps & {
    ref?: React.Ref<HTMLButtonElement>;
  }
) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "md",
  });
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex items-center justify-center border border-border px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        shapeRadiusClass,
        className,
      )} // i18n-exempt -- DEV-000: UI utility classes
      {...props}
    />
  );
};
