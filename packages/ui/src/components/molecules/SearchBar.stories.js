import { SearchBar } from "./SearchBar";
const meta = {
    component: SearchBar,
    args: {
        suggestions: ["Apple", "Banana", "Cherry", "Date"],
        placeholder: "Search…",
    },
    argTypes: {
        onSelect: { action: "select" },
    },
};
export default meta;
export const Default = {};
