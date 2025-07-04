/// <reference types="react" />
export declare const statuses: readonly ["all", "active", "draft", "archived"];
interface Props {
    search: string;
    status: string;
    onSearchChange(v: string): void;
    onStatusChange(v: string): void;
}
export default function ProductFilters({ search, status, onSearchChange, onStatusChange, }: Props): import("react").JSX.Element;
export {};
