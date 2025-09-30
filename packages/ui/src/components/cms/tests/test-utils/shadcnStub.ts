/* Test helper: minimal shadcn-ui stub used by MediaManager tests */
export function createShadcnStub() {
  // Use CJS require to avoid ESM interop hassles under ts-jest in CJS mode
  const React = require("react");
  const passthrough = (tag = "div") => {
    const Comp = React.forwardRef(function PassthroughComponent(
      { asChild: _asChild, ...props }: any,
      ref: any
    ) {
      return React.createElement(tag, { ref, ...props });
    });
    (Comp as any).displayName = `Passthrough(${tag})`;
    return Comp;
  };
  return {
    Input: passthrough("input"),
    Textarea: passthrough("textarea"),
    Button: passthrough("button"),
    Card: passthrough("div"),
    CardContent: passthrough("div"),
    Checkbox: (() => {
      const Checkbox = React.forwardRef(function CheckboxMock(
        props: any,
        ref: any
      ) {
        return React.createElement("input", { ref, type: "checkbox", ...props });
      });
      (Checkbox as any).displayName = "CheckboxMock";
      return Checkbox;
    })(),
    Progress: passthrough(),
    Tag: ({ children, ...rest }: any) => React.createElement("span", rest, children),
    DropdownMenu: ({ children }: any) => React.createElement("div", null, children),
    DropdownMenuTrigger: ({ children, asChild, ...rest }: any) => {
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, rest);
      }
      return React.createElement("button", { type: "button", ...rest }, children);
    },
    DropdownMenuContent: ({ children, asChild: _asChild, ...rest }: any) =>
      React.createElement("div", rest, children),
    DropdownMenuItem: ({ children, onSelect, asChild: _asChild, ...rest }: any) =>
      React.createElement(
        "div",
        { role: "menuitem", tabIndex: 0, onClick: (event: any) => onSelect?.(event), ...rest },
        children
      ),
    DropdownMenuLabel: ({ children }: any) => React.createElement("div", null, children),
    DropdownMenuSeparator: () => React.createElement("hr", null),
    Select: ({ children, ...rest }: any) => React.createElement("select", rest, children),
    SelectTrigger: ({ children, asChild: _asChild, ...rest }: any) =>
      React.createElement("div", rest, children),
    SelectValue: ({ placeholder }: any) => React.createElement("option", null, placeholder),
    SelectContent: ({ children }: any) => React.createElement("div", null, children),
    SelectItem: ({ children, ...rest }: any) => React.createElement("option", rest, children),
    Dialog: ({ children, onOpenChange, open, asChild: _asChild, ...rest }: any) =>
      React.createElement("div", { ...rest, "data-open": open ? "true" : undefined }, children),
    DialogContent: passthrough(),
    DialogHeader: ({ children }: any) => React.createElement("div", null, children),
    DialogTitle: ({ children }: any) => React.createElement("div", null, children),
    DialogDescription: ({ children }: any) => React.createElement("div", null, children),
    DialogFooter: ({ children }: any) => React.createElement("div", null, children),
  };
}

