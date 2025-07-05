import ProductEditorForm from "./ProductEditorForm";
const sample = {
    id: "1",
    sku: "SAMPLE-1",
    title: { en: "Sample", de: "Sample", it: "Sample" },
    description: {
        en: "Sample product",
        de: "Sample product",
        it: "Sample product",
    },
    price: 1000,
    currency: "EUR",
    images: [],
    status: "draft",
    shop: "demo",
    row_version: 1,
    created_at: "",
    updated_at: "",
};
const meta = {
    component: ProductEditorForm,
    args: {
        product: sample,
        locales: ["en", "de", "it"],
        onSave: async () => ({ product: sample }),
    },
    argTypes: {
        product: { control: "object" },
        locales: { control: "object" },
        onSave: { action: "save" },
    },
};
export default meta;
export const Default = {};
