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

export const Stack = ({ children, asChild, ...props }: any) => {
  const { gap: _g, align: _a, ...rest } = props;
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, rest);
  }
  return React.createElement("div", { "data-testid": "stack", ...rest }, children);
};

export const Cluster = ({ children, asChild, ...props }: any) => {
  const { gap: _g, alignY: _ay, justify: _j, wrap: _w, ...rest } = props;
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, rest);
  }
  return React.createElement("div", { "data-testid": "cluster", ...rest }, children);
};

export const Inline = ({ children, asChild, ...props }: any) => {
  const { gap: _g, align: _a, wrap: _w, ...rest } = props;
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, rest);
  }
  return React.createElement("div", { "data-testid": "inline", ...rest }, children);
};

// ---- Dropdown menu stubs ----

const DropdownMenuCtx = React.createContext<{
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}>({ open: false });

export const DropdownMenu = ({ children, open = false, onOpenChange }: any) =>
  React.createElement(DropdownMenuCtx.Provider, { value: { open, onOpenChange } }, children);

export const DropdownMenuTrigger = ({ children, asChild }: any) => {
  if (asChild && React.isValidElement(children)) {
    return children;
  }
  return React.createElement("button", {}, children);
};

export const DropdownMenuContent = ({ children, onMouseEnter, onMouseLeave }: any) => {
  const { open, onOpenChange } = React.useContext(DropdownMenuCtx);
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange?.(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);
  if (!open) return null;
  return React.createElement("div", { role: "menu", onMouseEnter, onMouseLeave }, children);
};

export const DropdownMenuItem = ({ children, asChild, ...props }: any) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, { role: "menuitem" });
  }
  return React.createElement("div", { role: "menuitem", ...props }, children);
};

export const DropdownMenuSeparator = () => React.createElement("hr", {});
export const DropdownMenuLabel = ({ children }: any) => React.createElement("div", {}, children);
export const DropdownMenuGroup = ({ children }: any) => React.createElement("div", {}, children);
export const DropdownMenuPortal = ({ children }: any) => children;
export const DropdownMenuSub = ({ children }: any) => React.createElement("div", {}, children);
export const DropdownMenuSubTrigger = ({ children }: any) => React.createElement("div", {}, children);
export const DropdownMenuSubContent = ({ children }: any) => React.createElement("div", {}, children);
export const DropdownMenuRadioGroup = ({ children }: any) => React.createElement("div", {}, children);
export const DropdownMenuCheckboxItem = ({ children }: any) => React.createElement("div", {}, children);
export const DropdownMenuRadioItem = ({ children }: any) => React.createElement("div", {}, children);
export const DropdownMenuShortcut = ({ children }: any) => React.createElement("span", {}, children);
