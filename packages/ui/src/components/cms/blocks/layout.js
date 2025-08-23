import Header from "./HeaderBlock";
import Footer from "./FooterBlock";
const defaultPreview = "/window.svg";
const layoutEntries = {
    Header: { component: Header },
    Footer: { component: Footer },
};
export const layoutRegistry = Object.fromEntries(Object.entries(layoutEntries).map(([k, v]) => [
    k,
    { previewImage: defaultPreview, ...v },
]));
