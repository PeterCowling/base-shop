import type { CustomHtmlComponent } from "@acme/types";
interface Props {
    component: CustomHtmlComponent;
    onChange: (patch: Partial<CustomHtmlComponent>) => void;
}
export default function CustomHtmlEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=CustomHtmlEditor.d.ts.map