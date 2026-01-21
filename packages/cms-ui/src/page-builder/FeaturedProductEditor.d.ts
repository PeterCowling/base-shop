type FeaturedProductComponent = {
    type: "FeaturedProduct";
    sku?: string;
    collectionId?: string;
};
interface Props {
    component: FeaturedProductComponent;
    onChange: (patch: Partial<FeaturedProductComponent>) => void;
}
export default function FeaturedProductEditor({ component, onChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=FeaturedProductEditor.d.ts.map