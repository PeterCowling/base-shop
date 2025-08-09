import * as React from "react";
export const Slot = React.forwardRef(({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
        return React.cloneElement(children, {
            ...props,
            ref,
        });
    }
    return null;
});
Slot.displayName = "Slot";
