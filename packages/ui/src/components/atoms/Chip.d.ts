import * as React from "react";
import { TagProps } from "./Tag";
export interface ChipProps extends TagProps {
    onRemove?: () => void;
}
export declare const Chip: React.ForwardRefExoticComponent<ChipProps & React.RefAttributes<HTMLSpanElement>>;
//# sourceMappingURL=Chip.d.ts.map