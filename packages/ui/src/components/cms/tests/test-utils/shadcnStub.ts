/* Test helper: minimal shadcn-ui stub used by MediaManager tests */
import React, {
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ElementType,
  type ReactElement,
  type ReactNode,
} from "react";

type AsChildProp = { asChild?: boolean };

const passthrough = <T extends ElementType>(tag: T) => {
  type Props = AsChildProp & Omit<ComponentPropsWithoutRef<T>, keyof AsChildProp>;

  const Component = React.forwardRef<ElementRef<T>, Props>(function PassthroughComponent(
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
  onSelect?: (event: React.SyntheticEvent<HTMLButtonElement>) => void;
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

export function createShadcnStub() {
  return {
    Input: passthrough<"input">("input"),
    Textarea: passthrough<"textarea">("textarea"),
    Button: passthrough<"button">("button"),
    Card: passthrough<"div">("div"),
    CardContent: passthrough<"div">("div"),
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
    DropdownMenuItem: React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
      function DropdownMenuItem({ children, onSelect, asChild, onClick, ...rest }, ref) {
        if (asChild && React.isValidElement(children)) {
          return React.cloneElement(children, { ref, ...rest });
        }

        const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          onSelect?.(event);
        };

        return React.createElement(
          "button",
          {
            ...rest,
            ref,
            type: "button",
            onClick: handleClick,
            onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
              if (event.key === "Enter" || event.key === " ") {
                onSelect?.(event);
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
    DialogContent: passthrough<"div">("div"),
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

