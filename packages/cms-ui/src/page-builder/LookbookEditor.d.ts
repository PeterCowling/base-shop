import type { LookbookComponent } from "@acme/types";
interface Props {
    component: LookbookComponent;
    onChange: (patch: Partial<LookbookComponent>) => void;
}
export default function LookbookEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=LookbookEditor.d.ts.map