import { StockStatus } from "./StockStatus";
const meta = {
    title: "Atoms/StockStatus",
    component: StockStatus,
};
export default meta;
export const InStock = {
    args: { inStock: true, labelInStock: "In Stock" },
};
export const LowStock = {
    args: { inStock: true, labelInStock: "Low Stock" },
};
export const SoldOut = {
    args: { inStock: false, labelOutOfStock: "Sold Out" },
};
