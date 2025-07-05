// packages/template-app/src/app/[lang]/generateStaticParams.ts
import { LOCALES } from "@types";
export default function generateStaticParams() {
    /* prerender /en, /de, /it — Next will also serve `/` via default locale */
    return LOCALES.map((lang) => ({ lang }));
}
