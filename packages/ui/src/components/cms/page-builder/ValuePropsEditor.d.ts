import type { ValuePropsComponent } from "@acme/types";
interface Props {
    component: ValuePropsComponent;
    onChange: (patch: Partial<ValuePropsComponent>) => void;
}
export default function ValuePropsEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ValuePropsEditor.d.ts.map