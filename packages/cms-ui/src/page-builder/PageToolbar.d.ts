import type { Locale } from "@acme/i18n/locales";
interface Props {
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
}
declare const PageToolbar: ({ deviceId, setDeviceId, orientation, setOrientation, locale, setLocale, locales, progress, isValid, }: Props) => import("react/jsx-runtime").JSX.Element;
export default PageToolbar;
//# sourceMappingURL=PageToolbar.d.ts.map
