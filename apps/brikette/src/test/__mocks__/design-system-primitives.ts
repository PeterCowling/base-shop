// Mock for @acme/design-system/primitives and @acme/design-system/atoms/*
// Provides lightweight stubs for common primitives so component tests can render.
// Tests that need specific behavior should override with jest.mock().
import React from "react";

export const Button = ({
  children,
  asChild,
  tone: _tone,
  color: _color,
  variant: _variant,
  size: _size,
  leadingIcon: _leadingIcon,
  trailingIcon: _trailingIcon,
  iconSize: _iconSize,
  iconOnly: _iconOnly,
  ...props
}: any) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, props);
  }
  return React.createElement("button", { type: "button", ...props }, children);
};

export const Card = ({ children, ...props }: any) =>
  React.createElement("div", { "data-testid": "card", ...props }, children);

export const Input = (props: any) =>
  React.createElement("input", props);

export const Grid = ({ children, ...props }: any) => {
  const { columns: _c, gap: _g, ...rest } = props;
  return React.createElement("div", { "data-testid": "grid", ...rest }, children);
};

export const Section = ({ as: Comp = "section", children, ...props }: any) =>
  React.createElement(Comp, props, children);
