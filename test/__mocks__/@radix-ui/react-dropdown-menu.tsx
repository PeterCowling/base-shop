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

  type ChildProps = React.HTMLAttributes<HTMLElement>;
  const childElement = React.isValidElement(children)
    ? (children as React.ReactElement<ChildProps>)
    : null;
  const childProps = childElement?.props ?? {};

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    childProps.onClick?.(event);
    onClick?.(event);
    if (!event.defaultPrevented && event.detail !== 0) {
      setOpen?.((prev) => !prev);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    childProps.onKeyDown?.(event);
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
    "aria-expanded": open,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
  };

  if (childElement) {
    return React.cloneElement(childElement, {
      ...sharedProps,
      ref,
    } as ChildProps & { ref?: React.Ref<HTMLElement> });
  }

  return (
    <button
      type="button"
      ref={ref as React.Ref<HTMLButtonElement>}
      {...(sharedProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
});

const assignRef = <T,>(ref: React.Ref<T | null> | undefined, value: T | null) => {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    (ref as React.MutableRefObject<T | null>).current = value;
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

const createPrimitive = (displayName: string, role?: string) => {
  return React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function Primitive(
    { children, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        data-radix-mock={displayName}
        role={role}
        {...props}
      >
        {children}
      </div>
    );
  });
};

export const Group = createPrimitive("Group");
export const Sub = createPrimitive("Sub");
export const Portal = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const RadioGroup = createPrimitive("RadioGroup");
export const SubTrigger = createPrimitive("SubTrigger");
export const SubContent = createPrimitive("SubContent");
export const CheckboxItem = createPrimitive("CheckboxItem");
export const RadioItem = createPrimitive("RadioItem");
export const ItemIndicator = createPrimitive("ItemIndicator");
export const Label = createPrimitive("Label");
export const Separator = createPrimitive("Separator", "separator");

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
