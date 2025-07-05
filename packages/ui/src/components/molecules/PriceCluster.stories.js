import { PriceCluster } from "./PriceCluster";
const meta = {
    component: PriceCluster,
    args: {
        price: 80,
        compare: 100,
        currency: "EUR",
    },
    argTypes: {
        price: { control: "number" },
        compare: { control: "number" },
        currency: { control: "text" },
    },
};
export default meta;
export const Default = {};
