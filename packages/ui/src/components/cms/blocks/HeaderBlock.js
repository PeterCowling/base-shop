import { jsx as _jsx } from "react/jsx-runtime";
import { Header } from "../../organisms/Header";
/** CMS wrapper for the Header organism */
export default function HeaderBlock({ nav = [], logo, locale }) {
    return _jsx(Header, { nav: nav, logo: logo, locale: locale });
}
