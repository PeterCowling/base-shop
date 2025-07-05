import ProductsTable from "./ProductsTable";
const rows = [
    {
        id: "1",
        sku: "sku1",
        title: { en: "Sneaker", de: "Sneaker", it: "Sneaker" },
        description: {
            en: "Green sneaker",
            de: "Green sneaker",
            it: "Green sneaker",
        },
        price: 10000,
        currency: "USD",
        images: [],
        created_at: "2023-01-01",
        updated_at: "2023-01-01",
        shop: "shop1",
        status: "active",
        row_version: 1,
    },
];
const meta = {
    title: "CMS/ProductsTable",
    component: ProductsTable,
    tags: ["autodocs"],
    args: {
        shop: "shop1",
        rows,
        isAdmin: true,
    },
};
export default meta;
export const Default = {};
