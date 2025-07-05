import { CheckoutStepper } from "./CheckoutStepper";
const meta = {
    component: CheckoutStepper,
    args: {
        steps: ["Shipping", "Payment", "Review"],
        currentStep: 0,
    },
};
export default meta;
export const Default = {};
