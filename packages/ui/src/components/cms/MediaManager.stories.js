import MediaManager from "./MediaManager";
const files = [{ url: "/sample.jpg", altText: "Sample" }];
const meta = {
    component: MediaManager,
    args: {
        shop: "demo",
        initialFiles: files,
    },
    argTypes: {
        shop: { control: "text" },
        initialFiles: { control: "object" },
    },
};
export default meta;
export const Default = {};
