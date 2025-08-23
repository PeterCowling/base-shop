import type { PageComponent } from "@acme/types";
interface Props {
    component: PageComponent;
    handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}
export default function InteractionsPanel({ component, handleInput, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=InteractionsPanel.d.ts.map