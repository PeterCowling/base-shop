export type ValuePropItem = {
    icon: string;
    title: string;
    desc: string;
};
declare function ValuePropsInner({ items }: {
    items?: ValuePropItem[];
}): import("react/jsx-runtime").JSX.Element;
export declare const ValueProps: import("react").MemoExoticComponent<typeof ValuePropsInner>;
export default ValueProps;
//# sourceMappingURL=ValueProps.d.ts.map