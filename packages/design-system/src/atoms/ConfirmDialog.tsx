"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../shadcn/AlertDialog";
import { cn } from "../utils/style";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
  className?: string;
}

export const ConfirmDialog = (
  {
    ref,
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel = "Cancel",
    onConfirm,
    variant = "default",
    className,
  }: ConfirmDialogProps & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        ref={ref}
        className={cn(className)}
        {...(!description ? { "aria-describedby": undefined } : {})}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn(
              variant === "destructive" &&
                "bg-danger text-danger-foreground hover:bg-danger/90",
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
