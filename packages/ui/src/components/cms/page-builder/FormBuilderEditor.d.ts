import type { FormField } from "@acme/types";
type FormBuilderComponent = {
    type: "FormBuilderBlock";
    fields?: FormField[];
};
interface Props {
    component: FormBuilderComponent;
    onChange: (patch: Partial<FormBuilderComponent>) => void;
}
export default function FormBuilderEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FormBuilderEditor.d.ts.map