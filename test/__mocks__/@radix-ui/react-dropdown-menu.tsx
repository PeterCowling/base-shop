import * as React from "react";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

type RootProps = React.HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const Root = React.forwardRef<HTMLDivElement, RootProps>(function Root(
  { children, open: controlledOpen, defaultOpen = false, onOpenChange, ...props },
  ref
) {
  const isControlled = controlledOpen != null;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = isControlled ? Boolean(controlledOpen) : uncontrolledOpen;

  const setOpen = React.useCallback<DropdownMenuContextValue["setOpen"]>(
    (value) => {
      const next =
        typeof value === "function" ? (value as (prev: boolean) => boolean)(open) : value;
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange, open]
  );

  const context = React.useMemo<DropdownMenuContextValue>(() => ({ open, setOpen }), [open, setOpen]);

  return (
    <DropdownMenuContext.Provider value={context}>
      <div ref={ref} data-radix-mock="Root" {...props}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
});

type TriggerProps = React.HTMLAttributes<HTMLElement> & {
  asChild?: boolean;
};

const focusFirstItem = (container: HTMLElement | null) => {
  const first = container?.querySelector<HTMLElement>("[role='menuitem']");
  first?.focus();
};

const mergeClassNames = (
  ...values: Array<string | undefined>
): string | undefined => {
  return values.filter(Boolean).join(" ") || undefined;
};

export const Trigger = React.forwardRef<HTMLElement, TriggerProps>(function Trigger(
  { children, asChild: _asChild, onClick, onKeyDown, className, ...props },
  ref
) {
  const context = React.useContext(DropdownMenuContext);
  const open = context?.open ?? false;
  const setOpen = context?.setOpen;

  const childProps = React.isValidElement(children) ? children.props : {};

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    (childProps.onClick as ((event: React.MouseEvent<HTMLElement>) => void) | undefined)?.(event);
    onClick?.(event);
    if (!event.defaultPrevented && event.detail !== 0) {
      setOpen?.((prev) => !prev);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    (childProps.onKeyDown as ((event: React.KeyboardEvent<HTMLElement>) => void) | undefined)?.(event);
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "Enter" || event.key === " " || event.key === "Space" || event.key === "Spacebar") {
      event.preventDefault();
      setOpen?.(true);
    } else if (event.key === "Escape") {
      setOpen?.(false);
    }
  };

  const sharedProps = {
    ...props,
    className: mergeClassNames(childProps.className, className),
    "aria-haspopup": "menu" as const,
    "aria-expanded": open ? "true" : "false",
    onClick: handleClick,
    onKeyDown: handleKeyDown,
  };

  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...sharedProps,
      ref,
    });
  }

  return (
    <button type="button" ref={ref as React.Ref<HTMLButtonElement>} {...sharedProps}>
      {children}
    </button>
  );
});

const assignRef = <T,>(ref: React.Ref<T | null> | undefined, value: T | null) => {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    (ref as React.MutableRefObject<T>).current = value;
  }
};

const focusSibling = (current: HTMLElement, direction: 1 | -1) => {
  const container = current.closest("[data-radix-mock='Content']");
  if (!container) return;
  const items = Array.from(
    container.querySelectorAll<HTMLElement>("[role='menuitem']:not([aria-disabled='true'])")
  );
  if (!items.length) return;
  const index = items.indexOf(current);
  const nextIndex = index === -1 ? 0 : (index + direction + items.length) % items.length;
  items[nextIndex]?.focus();
};

type ContentProps = React.HTMLAttributes<HTMLDivElement> & {
  sideOffset?: number;
};

export const Content = React.forwardRef<HTMLDivElement, ContentProps>(function Content(
  { children, sideOffset: _sideOffset, onKeyDown, ...props },
  ref
) {
  const context = React.useContext(DropdownMenuContext);
  const open = context?.open ?? false;
  const setOpen = context?.setOpen;
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (open) {
      focusFirstItem(contentRef.current);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      {...props}
      ref={(node) => {
        contentRef.current = node;
        assignRef(ref, node);
      }}
      role="menu"
      data-radix-mock="Content"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "Escape") {
          setOpen?.(false);
        }
      }}
    >
      {children}
    </div>
  );
});

type ItemProps = React.HTMLAttributes<HTMLDivElement> & {
  onSelect?: (event: Event) => void;
  disabled?: boolean;
};

export const Item = React.forwardRef<HTMLDivElement, ItemProps>(function Item(
  { children, onSelect, onClick, onKeyDown, disabled, ...props },
  ref
) {
  const context = React.useContext(DropdownMenuContext);

  const handleSelect = (event: React.SyntheticEvent<HTMLDivElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
    onSelect?.(event.nativeEvent);
    context?.setOpen(false);
  };

  return (
    <div
      {...props}
      ref={ref}
      data-radix-mock="Item"
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled ? "true" : undefined}
      onClick={handleSelect}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          focusSibling(event.currentTarget, 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          focusSibling(event.currentTarget, -1);
        } else if (
          event.key === "Enter" ||
          event.key === " " ||
          event.key === "Space" ||
          event.key === "Spacebar"
        ) {
          event.preventDefault();
          handleSelect(event);
        } else if (event.key === "Escape") {
          context?.setOpen(false);
        }
      }}
    >
      {children}
    </div>
  );
});

const createPrimitive = <T extends HTMLElement>(displayName: string, role?: string) => {
  return React.forwardRef<T, React.HTMLAttributes<T>>(function Primitive(
    { children, ...props },
    ref
  ) {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        data-radix-mock={displayName}
        role={role}
        {...props}
      >
        {children}
      </div>
    );
  });
};

export const Group = createPrimitive<HTMLDivElement>("Group");
export const Sub = createPrimitive<HTMLDivElement>("Sub");
export const Portal = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const RadioGroup = createPrimitive<HTMLDivElement>("RadioGroup");
export const SubTrigger = createPrimitive<HTMLDivElement>("SubTrigger");
export const SubContent = createPrimitive<HTMLDivElement>("SubContent");
export const CheckboxItem = createPrimitive<HTMLDivElement>("CheckboxItem");
export const RadioItem = createPrimitive<HTMLDivElement>("RadioItem");
export const ItemIndicator = createPrimitive<HTMLDivElement>("ItemIndicator");
export const Label = createPrimitive<HTMLDivElement>("Label");
export const Separator = createPrimitive<HTMLDivElement>("Separator", "separator");

export default {
  Root,
  Trigger,
  Group,
  Sub,
  Portal,
  RadioGroup,
  SubTrigger,
  SubContent,
  Content,
  Item,
  CheckboxItem,
  RadioItem,
  ItemIndicator,
  Label,
  Separator,
};
