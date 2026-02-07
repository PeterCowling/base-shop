// i18n-exempt -- BOS-04 [ttl=2026-03-01] Scaffold page; real UI in BOS-11+
/* eslint-disable ds/no-unsafe-viewport-units, ds/no-nonlayered-zindex, ds/container-widths-only-at, ds/min-tap-size, ds/no-hardcoded-copy -- BOS-04 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Business OS</h1>
        <p className="text-lg mb-4">
          Repo-native Business OS + Kanban system for coordinating human and agent work.
        </p>
        <div className="mt-8 space-y-4">
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Phase 0: Local Development</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Single-user mode (Pete only)</li>
              <li>No authentication required</li>
              <li>Local git operations via simple-git</li>
              <li>Auto-PR workflow to main</li>
            </ul>
          </div>
          <div className="mt-4 space-x-4">
            <a
              href="/boards/global"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Global Board
            </a>
            <a
              href="/boards/BRIK"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Brikette Board
            </a>
            <a
              href="/boards/PLAT"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Platform Board
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
