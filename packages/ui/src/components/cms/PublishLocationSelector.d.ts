export interface PublishLocationSelectorProps {
    selectedIds: string[];
    onChange: (nextSelectedIds: string[]) => void;
    showReload?: boolean;
}
declare function PublishLocationSelectorInner({ selectedIds, onChange, showReload, }: PublishLocationSelectorProps): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof PublishLocationSelectorInner>;
export default _default;
