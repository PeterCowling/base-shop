import PublishLocationSelector from "./PublishLocationSelector";
const meta = {
    component: PublishLocationSelector,
    args: {
        selectedIds: [],
        showReload: false,
    },
    argTypes: {
        selectedIds: { control: "object" },
        showReload: { control: "boolean" },
        onChange: { action: "change" },
    },
};
export default meta;
export const Default = {};
