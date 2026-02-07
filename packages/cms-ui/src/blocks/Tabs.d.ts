import { type ReactNode } from "react";
export interface TabsBlockProps {
    /** Labels for each tab */
    labels?: string[];
    /** Index of the initially active tab */
    active?: number;
    /** Tab contents; each child corresponds to the label at the same index */
    children?: ReactNode[] | ReactNode;
    className?: string;
}
export default function TabsBlock({ labels, active, children, className, }: TabsBlockProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Tabs.d.ts.map