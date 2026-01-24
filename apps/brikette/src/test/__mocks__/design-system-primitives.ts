// Mock for @acme/design-system/primitives and @acme/design-system/atoms/*
// Provides lightweight stubs for common primitives so component tests can render.
// Tests that need specific behavior should override with jest.mock().
import React from "react";

export const Button = ({ children, ...props }: any) =>
  React.createElement("button", { type: "button", ...props }, children);

export const Card = ({ children, ...props }: any) =>
  React.createElement("div", { "data-testid": "card", ...props }, children);

export const Input = (props: any) =>
  React.createElement("input", props);

export const Grid = ({ children, ...props }: any) => {
  const { columns: _c, gap: _g, ...rest } = props;
  return React.createElement("div", { "data-testid": "grid", ...rest }, children);
};
