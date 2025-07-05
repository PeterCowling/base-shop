import type { PageComponent } from "@types";
interface Props {
    component: PageComponent;
    onChange: (patch: Partial<PageComponent>) => void;
}
export default function ComponentEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=ComponentEditor.d.ts.map