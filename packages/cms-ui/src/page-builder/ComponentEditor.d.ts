import type { PageComponent } from "@acme/types";
interface Props {
    component: PageComponent | null;
    onChange: (patch: Partial<PageComponent>) => void;
    onResize: (patch: {
        width?: string;
        height?: string;
        top?: string;
        left?: string;
        widthDesktop?: string;
        widthTablet?: string;
        widthMobile?: string;
        heightDesktop?: string;
        heightTablet?: string;
        heightMobile?: string;
        marginDesktop?: string;
        marginTablet?: string;
        marginMobile?: string;
        paddingDesktop?: string;
        paddingTablet?: string;
        paddingMobile?: string;
    }) => void;
}
declare function ComponentEditor({ component, onChange, onResize }: Props): import("react/jsx-runtime").JSX.Element | null;
declare const _default: import("react").MemoExoticComponent<typeof ComponentEditor>;
export default _default;
//# sourceMappingURL=ComponentEditor.d.ts.map