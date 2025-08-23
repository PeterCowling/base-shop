import type { Locale } from "@acme/i18n/locales";
interface Props {
    viewport: "desktop" | "tablet" | "mobile";
    deviceId: string;
    setDeviceId: (id: string) => void;
    orientation: "portrait" | "landscape";
    setOrientation: (o: "portrait" | "landscape") => void;
    locale: Locale;
    setLocale: (l: Locale) => void;
    locales: readonly Locale[];
    progress: {
        done: number;
        total: number;
    } | null;
    isValid: boolean | null;
    showGrid: boolean;
    toggleGrid: () => void;
    gridCols: number;
    setGridCols: (n: number) => void;
}
declare const PageToolbar: ({ viewport, deviceId, setDeviceId, orientation, setOrientation, locale, setLocale, locales, progress, isValid, showGrid, toggleGrid, gridCols, setGridCols, }: Props) => import("react/jsx-runtime").JSX.Element;
export default PageToolbar;
//# sourceMappingURL=PageToolbar.d.ts.map