export type DevicePreset = {
    id: string;
    label: string;
    width: number;
    height: number;
    type: "desktop" | "tablet" | "mobile";
    orientation: "portrait" | "landscape";
};
export declare const devicePresets: DevicePreset[];
export declare function getLegacyPreset(type: "desktop" | "tablet" | "mobile"): DevicePreset;
export default devicePresets;
//# sourceMappingURL=devicePresets.d.ts.map