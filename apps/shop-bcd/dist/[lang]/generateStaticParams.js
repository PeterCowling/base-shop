// src/app/[lang]/generateStaticParams.ts
export default function generateStaticParams() {
    return ["en", "de", "it"].map((lang) => ({ lang }));
}
