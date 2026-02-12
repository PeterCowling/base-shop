// i18n-exempt -- BOS-04 [ttl=2026-12-01] Internal tool landing page
/* eslint-disable ds/no-hardcoded-copy -- BOS-04 Internal tool, no public-facing copy */
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-12">
      <h1 className="text-3xl font-bold text-brand-heading">Business OS</h1>

      {/* eslint-disable-next-line ds/container-widths-only-at -- GS-001: landing page layout */}
      <div className="grid w-full max-w-xl grid-cols-2 gap-6">
        <Link
          href="/guides"
          className="flex flex-col items-center gap-3 rounded-xl border border-brand-outline/30 bg-brand-surface p-8 shadow-sm transition-all hover:border-brand-primary/50 hover:shadow-md"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span className="text-lg font-semibold text-brand-heading">Guide Drafting</span>
          <span className="text-center text-sm text-brand-text/70">
            Create and edit guide content, run SEO audits, manage translations
          </span>
        </Link>

        <Link
          href="/boards/global"
          className="flex flex-col items-center gap-3 rounded-xl border border-brand-outline/30 bg-brand-surface p-8 shadow-sm transition-all hover:border-brand-secondary/50 hover:shadow-md"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-secondary">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span className="text-lg font-semibold text-brand-heading">Kanban Board</span>
          <span className="text-center text-sm text-brand-text/70">
            Plan and track work across boards for humans and agents
          </span>
        </Link>
      </div>
    </main>
  );
}
