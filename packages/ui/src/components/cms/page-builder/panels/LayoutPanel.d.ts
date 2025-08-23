import type { PageComponent } from "@acme/types";
interface Props {
    component: PageComponent;
    handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
    handleResize: (field: string, value: string) => void;
    handleFullSize: (field: string) => void;
}
export default function LayoutPanel({ component, handleInput, handleResize, handleFullSize, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=LayoutPanel.d.ts.map