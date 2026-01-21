interface LocationInput {
    lat?: number | string;
    lng?: number | string;
    label?: string;
}
interface Props {
    /** Locations to display on the map */
    locations?: LocationInput[];
    /** Initial zoom level */
    zoom?: number;
}
/** CMS wrapper for the StoreLocatorMap organism supporting multiple locations */
export default function StoreLocatorBlock({ locations, zoom }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=StoreLocatorBlock.d.ts.map