import { jsx as _jsx } from "react/jsx-runtime";
import { Content } from "../organisms/Content";
import { Footer } from "../organisms/Footer";
import { Header } from "../organisms/Header";
import { SideNav } from "../organisms/SideNav";
import { AppShell } from "./AppShell";
const meta = {
    title: "Layout/AppShell",
    component: AppShell,
    tags: ["autodocs"],
};
export default meta;
export const Default = {
    render: () => (_jsx(AppShell, { header: _jsx(Header, { locale: "en", children: "Header" }), sideNav: _jsx(SideNav, { children: "Nav" }), footer: _jsx(Footer, { children: "Footer" }), children: _jsx(Content, { children: "Content" }) })),
};
