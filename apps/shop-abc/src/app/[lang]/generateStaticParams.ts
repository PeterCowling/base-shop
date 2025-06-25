// apps/shop-abc/src/app/[[...lang]]/generateStaticParams.ts
export default function generateStaticParams() {
  /* prerender /en, /de, /it — Next will also serve `/` via default locale */
  return ["en", "de", "it"].map((lang) => ({ lang }));
}
