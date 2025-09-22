import React from "react";

const passthrough = (tag = "div") =>
  React.forwardRef(({ asChild: _asChild, ...props }: any, ref: any) =>
    React.createElement(tag, { ref, ...props })
  );

export const Input = passthrough("input");
export const Textarea = passthrough("textarea");
export const Button = passthrough("button");
export const Card = passthrough("div");
export const CardContent = passthrough("div");
export const Checkbox = React.forwardRef((props: any, ref: any) => (
  <input ref={ref} type="checkbox" {...props} />
));
// Implement a minimal Progress mock that avoids forwarding non-DOM props
// like `labelClassName` which would trigger React unknown prop warnings.
export const Progress = React.forwardRef(
  (
    {
      value: _value,
      label,
      labelClassName,
      className,
      // intentionally drop the rest to avoid leaking unknown props to DOM
    }: any,
    ref: any,
  ) => (
    <div ref={ref} className={className}>
      <div />
      {label ? <div className={labelClassName}>{label}</div> : null}
    </div>
  ),
);
export const Tag = ({ children, ...rest }: any) => <span {...rest}>{children}</span>;

export const DropdownMenu = ({ children }: any) => <div>{children}</div>;
export const DropdownMenuTrigger = ({ children, asChild, ...rest }: any) =>
  asChild && React.isValidElement(children) ? (
    React.cloneElement(children, rest)
  ) : (
    <button type="button" {...rest}>
      {children}
    </button>
  );
export const DropdownMenuContent = ({ children, asChild: _asChild, ...rest }: any) => (
  <div {...rest}>{children}</div>
);
export const DropdownMenuItem = ({ children, onSelect, asChild: _asChild, ...rest }: any) => {
  // Drop aria-label to keep accessible name matching visible text in tests
  const { ["aria-label"]: _ignored, ...props } = rest as any;
  return (
    <div role="menuitem" tabIndex={0} onClick={(event) => onSelect?.(event)} {...props}>
      {children}
    </div>
  );
};
export const DropdownMenuLabel = ({ children }: any) => <div>{children}</div>;
export const DropdownMenuSeparator = () => <hr />;

export const DialogContext = React.createContext<{ open: boolean; setOpen: (next: boolean) => void } | null>(null);
export const Dialog = ({ children, open, defaultOpen, onOpenChange }: any) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const resolvedOpen = isControlled ? open : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };
  return (
    <DialogContext.Provider value={{ open: resolvedOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
};
export const DialogContent = React.forwardRef(({ children, ...props }: any, ref: any) => {
  const ctx = React.useContext(DialogContext);
  if (!ctx?.open) return null;
  return (
    <div ref={ref as any} {...props}>
      {children}
    </div>
  );
});
export const DialogHeader = ({ children }: any) => <div>{children}</div>;
export const DialogTitle = ({ children }: any) => <div>{children}</div>;
export const DialogDescription = ({ children }: any) => <div>{children}</div>;
export const DialogFooter = ({ children }: any) => <div>{children}</div>;

export default {} as unknown as never;
