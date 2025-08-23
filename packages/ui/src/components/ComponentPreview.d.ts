import type { UpgradeComponent } from "@acme/types";
export interface ComponentPreviewProps<Props extends Record<string, unknown> = Record<string, unknown>> {
    component: UpgradeComponent;
    componentProps?: Props;
}
export default function ComponentPreview<Props extends Record<string, unknown> = Record<string, unknown>>({ component, componentProps }: ComponentPreviewProps<Props>): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ComponentPreview.d.ts.map