import type { HeroBannerComponent } from "@acme/types";
interface Props {
    component: HeroBannerComponent;
    onChange: (patch: Partial<HeroBannerComponent>) => void;
}
export default function HeroBannerEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=HeroBannerEditor.d.ts.map