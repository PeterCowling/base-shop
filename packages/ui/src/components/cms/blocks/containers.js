import Section from "./Section";
import MultiColumn from "./containers/MultiColumn";
const defaultPreview = "/window.svg";
const containerEntries = {
    Section: { component: Section },
    MultiColumn: { component: MultiColumn },
};
export const containerRegistry = Object.entries(containerEntries).reduce((acc, [k, v]) => {
    acc[k] = {
        previewImage: defaultPreview,
        ...v,
    };
    return acc;
}, {});
