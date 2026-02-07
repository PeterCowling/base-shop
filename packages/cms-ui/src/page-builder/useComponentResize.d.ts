type ResizePatch = Record<string, string | undefined>;
export default function useComponentResize(onResize: (patch: ResizePatch) => void): {
    handleResize: (field: string, value: string) => void;
    handleFullSize: (field: string) => void;
};
export {};
//# sourceMappingURL=useComponentResize.d.ts.map