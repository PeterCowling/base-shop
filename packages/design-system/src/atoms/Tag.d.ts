import * as React from "react";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** High-level semantic color */
    color?: "default" | "primary" | "accent" | "success" | "info" | "warning" | "danger" | "destructive";
    /** Fill intensity */
    tone?: "solid" | "soft";
    /** Back-compat alias for color: 'destructive' maps to 'danger' */
    variant?: "default" | "success" | "warning" | "destructive";
}
export declare const Tag: React.ForwardRefExoticComponent<TagProps & React.RefAttributes<HTMLSpanElement>>;
//# sourceMappingURL=Tag.d.ts.map
