import { Textarea } from "./textarea";
const meta = {
    component: Textarea,
    args: {
        label: "Message",
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
