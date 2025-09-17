import * as React from "react";

type AnyProps = React.HTMLAttributes<HTMLElement> & { [key: string]: unknown };

type Primitive = React.ForwardRefExoticComponent<AnyProps & React.RefAttributes<HTMLElement>>;

function createPrimitive(displayName: string): Primitive {
  return React.forwardRef<HTMLElement, AnyProps>(function Primitive(
    { children, ...props },
    ref
  ) {
    return (
      <div ref={ref} data-radix-mock={displayName} {...props}>
        {children}
      </div>
    );
  });
}

export const Root = createPrimitive("Root");
export const Trigger = createPrimitive("Trigger");
export const Group = createPrimitive("Group");
export const Sub = createPrimitive("Sub");
export const Portal = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
export const RadioGroup = createPrimitive("RadioGroup");
export const SubTrigger = createPrimitive("SubTrigger");
export const SubContent = createPrimitive("SubContent");
export const Content = createPrimitive("Content");
export const Item = createPrimitive("Item");
export const CheckboxItem = createPrimitive("CheckboxItem");
export const RadioItem = createPrimitive("RadioItem");
export const ItemIndicator = createPrimitive("ItemIndicator");
export const Label = createPrimitive("Label");
export const Separator = createPrimitive("Separator");

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
