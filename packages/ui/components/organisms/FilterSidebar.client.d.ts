import * as React from "react";
export type Filters = {
    size?: string;
};
export interface FilterSidebarProps {
    onChange: (filters: Filters) => void;
    /**
     * Width of the sidebar. Provide a Tailwind width class
     * (e.g. "w-64") or a numeric pixel value.
     * @default "w-64"
     */
    width?: string | number;
}
export declare function FilterSidebar({ onChange, width, }: FilterSidebarProps): React.JSX.Element;
