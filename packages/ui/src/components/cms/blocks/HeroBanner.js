import { jsx as _jsx } from "react/jsx-runtime";
import HeroBanner, {} from "../../home/HeroBanner.client";
export default function CmsHeroBanner({ slides = [], minItems, maxItems, }) {
    const list = slides.slice(0, maxItems ?? slides.length);
    if (!list.length || list.length < (minItems ?? 0))
        return null;
    return _jsx(HeroBanner, { slides: list });
}
