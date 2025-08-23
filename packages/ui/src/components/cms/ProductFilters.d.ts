export declare const statuses: readonly ["all", "active", "draft", "archived"];
interface Props {
    search: string;
    status: string;
    onSearchChange(v: string): void;
    onStatusChange(v: string): void;
}
export default function ProductFilters({ search, status, onSearchChange, onStatusChange, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ProductFilters.d.ts.map