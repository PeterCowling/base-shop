import { ARViewer } from "./ARViewer";
const meta = {
    title: "Atoms/ARViewer",
    component: ARViewer,
    args: {
        src: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
        className: "h-64 w-64",
    },
};
export default meta;
export const Primary = {};
export const Large = {
    args: { className: "h-96 w-96" },
};
