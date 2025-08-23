import PopupModal from "./PopupModal";
const defaultPreview = "/window.svg";
const overlayEntries = {
    PopupModal: { component: PopupModal },
};
export const overlayRegistry = Object.fromEntries(Object.entries(overlayEntries).map(([k, v]) => [
    k,
    { previewImage: defaultPreview, ...v },
]));
