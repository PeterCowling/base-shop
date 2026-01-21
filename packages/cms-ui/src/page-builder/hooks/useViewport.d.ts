import type { DevicePreset } from "@acme/ui/utils/devicePresets";
declare const useViewport: (device: DevicePreset) => {
    canvasWidth: number;
    canvasHeight: number;
    scale: number;
    viewportStyle: {
        width: string;
        height: string;
        transform: string;
        transformOrigin: string;
        transition: string;
    };
    frameClass: {
        desktop: string;
        tablet: string;
        mobile: string;
    };
};
export default useViewport;
//# sourceMappingURL=useViewport.d.ts.map