// Temporary test page to verify App Router is working
// DELETE THIS FILE after Phase 0 verification

/* eslint-disable ds/no-hardcoded-copy, ds/no-unsafe-viewport-units -- CFL-99 pre-existing: test page */
export default function AppRouterTestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">App Router Working</h1>
        <p className="mt-2 text-muted">
          This page is served by Next.js App Router.
        </p>
        <p className="mt-4 text-sm text-muted">
          Delete this file after verifying the migration setup.
        </p>
      </div>
    </div>
  );
}
