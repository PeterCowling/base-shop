/**
 * Test mock for @radix-ui/react-select (reception-only).
 *
 * Replaces the portal-based Radix Select with a native <select> element so
 * that userEvent.selectOptions and getByLabelText work correctly in JSDOM.
 *
 * The id prop on SelectTrigger is forwarded to the native <select> rendered
 * by SelectContent via React context, allowing label associations to work.
 */
import * as React from "react";

type SelectCtx = {
  value?: string;
  onValueChange?: (value: string) => void;
  triggerId?: string;
  setTriggerId: (id: string | undefined) => void;
};

const SelectCtx = React.createContext<SelectCtx>({ setTriggerId: () => undefined });

export const Root: React.FC<{
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
}> = ({ value, onValueChange, children }) => {
  const [triggerId, setTriggerId] = React.useState<string | undefined>(undefined);
  const ctx = React.useMemo(
    () => ({ value, onValueChange, triggerId, setTriggerId }),
    [value, onValueChange, triggerId]
  );
  return <SelectCtx.Provider value={ctx}>{children}</SelectCtx.Provider>;
};

export const Trigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(function Trigger({ id }, _ref) {
  const { setTriggerId } = React.useContext(SelectCtx);
  React.useLayoutEffect(() => {
    if (id !== undefined) setTriggerId(id);
    return () => setTriggerId(undefined);
  }, [id, setTriggerId]);
  // Renders nothing — Content renders the actual native <select>
  return null;
});

// Portal: inline in tests (no real portal needed)
export const Portal: React.FC<{ children?: React.ReactNode; container?: Element | null }> = ({
  children,
}) => <>{children}</>;

// Content: renders the native <select> element using id from context
export const Content = React.forwardRef<
  HTMLSelectElement,
  { children?: React.ReactNode; position?: string; sideOffset?: number; className?: string }
>(function Content({ children }, _ref) {
  const { value, onValueChange, triggerId } = React.useContext(SelectCtx);
  return (
    <select
      id={triggerId}
      role="combobox"
      value={value ?? ""}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      {children}
    </select>
  );
});

// Viewport: passthrough wrapper inside Content
export const Viewport: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
}) => <>{children}</>;

// Item: renders as a native <option> using value as text.
// Children are intentionally ignored: the DS SelectItem wrapper passes complex JSX
// (spans, indicators) as children which would be invalid inside <option> in JSDOM.
// Since tests select by value attribute, not display text, this is safe.
export const Item = React.forwardRef<
  HTMLOptionElement,
  { value: string; disabled?: boolean; children?: React.ReactNode; className?: string }
>(function Item({ value, disabled }, _ref) {
  return <option value={value} disabled={disabled}>{value}</option>;
});

// ItemText: passthrough (text content of an option)
export const ItemText: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

// ItemIndicator: suppressed in tests (no checkmark)
export const ItemIndicator: React.FC<{ children?: React.ReactNode }> = () => null;

// Value: suppressed (value shown by native select)
export const Value: React.FC<{ placeholder?: string; children?: React.ReactNode }> = () => null;

// Icon: suppressed (chevron arrow)
export const Icon: React.FC<{ children?: React.ReactNode; asChild?: boolean }> = () => null;

// Structural / grouping primitives
export const Group: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);
export const Label: React.FC<{ children?: React.ReactNode; className?: string }> = ({
  children,
}) => <>{children}</>;
export const Separator: React.FC<{ className?: string }> = () => null;
export const ScrollUpButton: React.FC = () => null;
export const ScrollDownButton: React.FC = () => null;

export default {
  Root,
  Trigger,
  Portal,
  Content,
  Viewport,
  Item,
  ItemText,
  ItemIndicator,
  Value,
  Icon,
  Group,
  Label,
  Separator,
  ScrollUpButton,
  ScrollDownButton,
};
