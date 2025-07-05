import { PaymentMethodSelector } from "./PaymentMethodSelector";
const meta = {
    component: PaymentMethodSelector,
    args: {
        methods: [
            { value: "card", label: "Credit Card" },
            { value: "paypal", label: "PayPal" },
        ],
        value: "card",
    },
    argTypes: {
        onChange: { action: "change" },
    },
};
export default meta;
export const Default = {};
