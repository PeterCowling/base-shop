import * as React from "react";
export interface Store {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
}
export interface StoreLocatorTemplateProps extends React.HTMLAttributes<HTMLDivElement> {
    stores: Store[];
    /** Optional map component to render on the page */
    map?: React.ReactNode;
}
/**
 * Display a map alongside a list of store locations.
 */
export declare function StoreLocatorTemplate({ stores, map, className, ...props }: StoreLocatorTemplateProps): React.JSX.Element;
