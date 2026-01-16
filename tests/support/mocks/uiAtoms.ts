import type { ComponentPropsWithoutRef, ReactNode } from "react";
import React from "react";

const createComponent =
  (tag: keyof JSX.IntrinsicElements) =>
  ({ children, ...rest }: ComponentPropsWithoutRef<"div"> & Record<string, unknown>) =>
    React.createElement(tag, rest, children);

const Section = createComponent("section");
const Grid = ({
  as: Component = "div",
  children,
  ...rest
}: ComponentPropsWithoutRef<"div"> & { as?: keyof JSX.IntrinsicElements }) =>
  React.createElement(Component, rest, children);

const Dialog = createComponent("div");
const DialogContent = createComponent("div");
const DialogHeader = createComponent("div");
const DialogTitle = createComponent("div");
const DialogDescription = createComponent("div");
const DialogFooter = createComponent("div");

const DialogTrigger = ({
  asChild,
  children,
  ...rest
}: ComponentPropsWithoutRef<"button"> & { asChild?: React.ReactElement }) => {
  if (asChild) {
    return React.cloneElement(asChild, { ...rest, children });
  }
  return (
    <button type="button" {...rest}>
      {children}
    </button>
  );
};

export const baseUiAtoms = {
  __esModule: true,
  Section,
  Grid,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  Button: ({ children, ...rest }: ComponentPropsWithoutRef<"button">) => (
    <button type="button" {...rest}>
      {children}
    </button>
  ),
  Link: ({ children, ...rest }: ComponentPropsWithoutRef<"a">) => (
    <a {...rest}>{children}</a>
  ),
};
