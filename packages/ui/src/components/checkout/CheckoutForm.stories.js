import CheckoutForm from "./CheckoutForm";
const meta = {
    component: CheckoutForm,
    args: {
        locale: "en",
    },
    argTypes: {
        locale: {
            control: { type: "radio" },
            options: ["en", "de", "it"],
        },
    },
};
export default meta;
export const Default = {};
