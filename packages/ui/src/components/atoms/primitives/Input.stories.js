import { Input } from "./input";
const meta = {
    component: Input,
    args: {
        label: "Email",
        error: "",
        floatingLabel: false,
    },
    argTypes: {
        label: { control: "text" },
        error: { control: "text" },
        floatingLabel: { control: "boolean" },
    },
};
export default meta;
export const Default = {};
export const WithError = {
    args: { error: "Invalid email" },
};
export const Disabled = {
    args: { disabled: true },
};
export const FloatingLabel = {
    args: { floatingLabel: true, label: "Email" },
};
