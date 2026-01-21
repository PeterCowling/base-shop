import type { PageComponent } from "@acme/types";
interface Props {
    component: PageComponent;
    onChange: (patch: Partial<PageComponent>) => void;
    handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}
export default function ContentPanel({ component, onChange, handleInput, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ContentPanel.d.ts.map