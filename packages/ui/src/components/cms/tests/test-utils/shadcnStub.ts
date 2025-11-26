/* Test helper: minimal shadcn-ui stub used by MediaManager tests */
import React, { type ReactElement, type ReactNode } from "react";

type AsChildProp = { asChild?: boolean };

const passthrough = (tag: keyof HTMLElementTagNameMap) => {
  type Props = AsChildProp & Record<string, unknown>;

  const Component = React.forwardRef<HTMLElement, Props>(function PassthroughComponent(
    { asChild: _asChild, ...props },
    ref
  ) {
    return React.createElement(tag, { ref, ...props });
  });

  Component.displayName = `Passthrough(${typeof tag === "string" ? tag : "component"})`;

  return Component;
};

type DropdownMenuItemProps = {
  children: ReactNode;
  onSelect?: (event: React.SyntheticEvent<HTMLElement>) => void;
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type DropdownMenuTriggerProps = {
  children: ReactNode;
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

type DropdownMenuContentProps = {
  children: ReactNode;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

type DropdownMenuProps = { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>;

type DropdownMenuLabelProps = { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>;

type DropdownMenuSeparatorProps = React.HTMLAttributes<HTMLHRElement>;

type SelectProps = { children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>;

type SelectTriggerProps = {
  children: ReactNode;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

type SelectValueProps = { placeholder?: ReactNode };

type SelectContentProps = { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>;

type SelectItemProps = { children: ReactNode } & React.OptionHTMLAttributes<HTMLOptionElement>;

type DialogProps = {
  children: ReactNode;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

type DialogSectionProps = { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>;

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

type TagProps = { children: ReactNode } & React.HTMLAttributes<HTMLSpanElement>;

type ProgressProps = React.HTMLAttributes<HTMLDivElement>;
type CloneableChild = ReactElement<Record<string, unknown>>;

export function createShadcnStub() {
  return {
    Input: passthrough("input"),
    Textarea: passthrough("textarea"),
    Button: passthrough("button"),
    Card: passthrough("div"),
    CardContent: passthrough("div"),
    Checkbox: React.forwardRef<HTMLInputElement, CheckboxProps>(function CheckboxMock(
      props,
      ref
    ) {
      return React.createElement("input", { ...props, ref, type: "checkbox" });
    }),
    Progress: ({ children, ...rest }: ProgressProps): ReactElement =>
      React.createElement("div", rest, children),
    Tag: ({ children, ...rest }: TagProps): ReactElement =>
      React.createElement("span", rest, children),
    DropdownMenu: ({ children, ...rest }: DropdownMenuProps): ReactElement =>
      React.createElement("div", rest, children),
    DropdownMenuTrigger: ({ children, asChild, ...rest }: DropdownMenuTriggerProps): ReactElement => {
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, rest);
      }

      return React.createElement(
        "button",
        { type: "button", ...rest },
        children
      );
    },
    DropdownMenuContent: ({ children, ...rest }: DropdownMenuContentProps): ReactElement =>
      React.createElement("div", rest, children),
    DropdownMenuItem: React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
      function DropdownMenuItem({ children, onSelect, asChild, onClick, disabled, onKeyDown, ...rest }, ref) {
        if (asChild && React.isValidElement(children)) {
          const childElement = children as CloneableChild;
          const forwardedProps: Partial<typeof childElement.props> & React.Attributes = {
            ...rest,
            ref,
          };
          return React.cloneElement(childElement, forwardedProps);
        }

        const handleActivate = (event: React.SyntheticEvent<HTMLElement>) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event as unknown as React.MouseEvent<HTMLButtonElement>);
          onSelect?.(event);
        };

        return React.createElement(
          "div",
          {
            ...rest,
            ref,
            role: "menuitem",
            tabIndex: disabled ? -1 : 0,
            "aria-disabled": disabled || undefined,
            onClick: handleActivate,
            onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
              onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLButtonElement>);
              if (event.defaultPrevented) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleActivate(event);
              }
            },
          },
          children
        );
      }
    ),
    DropdownMenuLabel: ({ children, ...rest }: DropdownMenuLabelProps): ReactElement =>
      React.createElement("div", rest, children),
    DropdownMenuSeparator: (props: DropdownMenuSeparatorProps): ReactElement =>
      React.createElement("hr", props),
    Select: ({ children, ...rest }: SelectProps): ReactElement =>
      React.createElement("select", rest, children),
    SelectTrigger: ({ children, ...rest }: SelectTriggerProps): ReactElement =>
      React.createElement("div", rest, children),
    SelectValue: ({ placeholder }: SelectValueProps): ReactElement =>
      React.createElement("option", null, placeholder),
    SelectContent: ({ children, ...rest }: SelectContentProps): ReactElement =>
      React.createElement("div", rest, children),
    SelectItem: ({ children, ...rest }: SelectItemProps): ReactElement =>
      React.createElement("option", rest, children),
    Dialog: ({ children, onOpenChange: _onOpenChange, open, ...rest }: DialogProps): ReactElement =>
      React.createElement("div", { ...rest, "data-open": open ? "true" : undefined }, children),
    DialogContent: passthrough("div"),
    DialogHeader: ({ children, ...rest }: DialogSectionProps): ReactElement =>
      React.createElement("div", rest, children),
    DialogTitle: ({ children, ...rest }: DialogSectionProps): ReactElement =>
      React.createElement("div", rest, children),
    DialogDescription: ({ children, ...rest }: DialogSectionProps): ReactElement =>
      React.createElement("div", rest, children),
    DialogFooter: ({ children, ...rest }: DialogSectionProps): ReactElement =>
      React.createElement("div", rest, children),
  };
}
