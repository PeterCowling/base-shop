export interface Guides {
    x: number | null;
    y: number | null;
}
export default function useGuides(containerRef: React.RefObject<HTMLElement | null>): {
    guides: Guides;
    setGuides: import("react").Dispatch<import("react").SetStateAction<Guides>>;
    siblingEdgesRef: import("react").RefObject<{
        vertical: number[];
        horizontal: number[];
    }>;
    computeSiblingEdges: () => {
        vertical: number[];
        horizontal: number[];
    };
};
//# sourceMappingURL=useGuides.d.ts.map