export type LookbookHotspot = {
    sku?: string;
    x: number;
    y: number;
};
interface Props {
    src?: string;
    alt?: string;
    hotspots?: LookbookHotspot[];
    /** Callback when hotspots are moved. Useful in editors */
    onHotspotsChange?: (hotspots: LookbookHotspot[]) => void;
}
export default function Lookbook({ src, alt, hotspots, onHotspotsChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Lookbook.d.ts.map