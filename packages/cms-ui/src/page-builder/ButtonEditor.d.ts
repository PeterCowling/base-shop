import type { ButtonComponent } from "@acme/types";
interface Props {
    component: ButtonComponent;
    onChange: (patch: Partial<ButtonComponent>) => void;
}
export default function ButtonEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ButtonEditor.d.ts.map