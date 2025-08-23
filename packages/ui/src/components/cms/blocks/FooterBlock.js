import { jsx as _jsx } from "react/jsx-runtime";
import { Footer } from "../../organisms/Footer";
/** CMS wrapper for the Footer organism */
export default function FooterBlock({ links = [], logo }) {
    return _jsx(Footer, { links: links, logo: logo });
}
