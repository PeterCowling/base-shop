import PageBuilder from "./PageBuilder";
const samplePage = {
    id: "1",
    slug: "sample",
    status: "draft",
    components: [],
    seo: {
        title: {
            en: "Sample",
            de: "Sample",
            it: "Sample",
        },
    },
    createdAt: "",
    updatedAt: "",
    createdBy: "",
};
const meta = {
    component: PageBuilder,
    args: {
        page: samplePage,
        onSave: async () => { },
        onPublish: async () => { },
    },
    argTypes: {
        onSave: { action: "save" },
        onPublish: { action: "publish" },
    },
};
export default meta;
export const GroupedPalette = {};
