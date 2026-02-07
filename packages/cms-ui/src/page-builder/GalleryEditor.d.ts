import type { GalleryComponent } from "@acme/types";
interface Props {
    component: GalleryComponent;
    onChange: (patch: Partial<GalleryComponent>) => void;
}
export default function GalleryEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=GalleryEditor.d.ts.map