// packages/template-app/src/app/not-found.tsx

/**
 * Minimal App Router not-found page for template-app.
 */
export default function NotFound() {
  return (
    <div className="grid place-items-center text-center py-16 px-4" style={{ minHeight: "100dvh" }}>
      <div>
        <h1 className="text-2xl leading-tight mb-3">{/* i18n-exempt: generic 404 heading */}Page not found</h1>
        <p className="opacity-80 mb-6">{/* i18n-exempt: generic 404 description */}The page you’re looking for doesn’t exist or has moved.</p>
        <a href="/" className="inline-block rounded-md border px-4 py-2 no-underline min-h-10 min-w-10">{/* i18n-exempt: generic 404 CTA */}Go to homepage</a>
      </div>
    </div>
  );
}
