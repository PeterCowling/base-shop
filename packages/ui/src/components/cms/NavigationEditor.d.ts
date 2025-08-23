export interface NavItem {
    id: string;
    label: string;
    url: string;
    children?: NavItem[];
}
interface Props {
    items: NavItem[];
    onChange: (items: NavItem[]) => void;
}
export default function NavigationEditor({ items, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=NavigationEditor.d.ts.map