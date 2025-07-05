import { Header } from "./Header";
const meta = {
    component: Header,
    args: {
        locale: "en",
        nav: [
            { title: "Home", href: "#" },
            { title: "Shop", href: "#" },
        ],
        searchSuggestions: ["Shoes", "Shirts"],
    },
};
export default meta;
export const Default = {};
