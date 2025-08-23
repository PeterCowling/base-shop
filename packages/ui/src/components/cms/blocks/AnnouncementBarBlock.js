import { jsx as _jsx } from "react/jsx-runtime";
import AnnouncementBar from "../../organisms/AnnouncementBar";
/** CMS wrapper for the AnnouncementBar organism */
export default function AnnouncementBarBlock({ text, link, closable }) {
    if (!text)
        return null;
    return _jsx(AnnouncementBar, { text: text, href: link, closable: closable });
}
