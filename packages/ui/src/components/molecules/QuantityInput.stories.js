import { QuantityInput } from "./QuantityInput";
const meta = {
    component: QuantityInput,
    args: {
        value: 1,
        min: 1,
        max: 5,
    },
    argTypes: {
        onChange: { action: "change" },
    },
};
export default meta;
export const Default = {};
