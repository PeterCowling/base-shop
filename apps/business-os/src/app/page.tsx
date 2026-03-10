// i18n-exempt -- BOS-04 [ttl=2026-12-01] Internal tool landing page
/* eslint-disable ds/no-hardcoded-copy -- BOS-04 Internal tool, no public-facing copy */
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-12">
      <h1 className="text-3xl font-bold text-brand-heading">Business OS</h1>
      {/* eslint-disable-next-line ds/container-widths-only-at -- GS-001: landing page intro copy */}
      <p className="max-w-3xl text-center text-sm text-brand-text/70">
        Workflow-first operating console for ideas, plans, startup-loop execution,
        and process improvement. Legacy board views remain available for compatibility.
      </p>

      {/* eslint-disable-next-line ds/container-widths-only-at -- GS-001: landing page layout */}
      <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
        <Link
          href="/ideas"
          className="flex flex-col items-center gap-3 rounded-xl border border-brand-outline/30 bg-brand-surface p-8 shadow-sm transition-all hover:border-brand-secondary/50 hover:shadow-md"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-secondary">
            <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z" />
          </svg>
          <span className="text-lg font-semibold text-brand-heading">Ideas</span>
          <span className="text-center text-sm text-brand-text/70">
            Capture opportunities, triage signals, and start workflow-native follow-up.
          </span>
        </Link>

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
          href="/workflows"
          className="flex flex-col items-center gap-3 rounded-xl border border-brand-outline/30 bg-brand-surface p-8 shadow-sm transition-all hover:border-brand-accent/50 hover:shadow-md"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent">
            <rect x="3" y="4" width="18" height="4" rx="1" />
            <rect x="3" y="10" width="18" height="4" rx="1" />
            <rect x="3" y="16" width="18" height="4" rx="1" />
          </svg>
          <span className="text-lg font-semibold text-brand-heading">Workflows</span>
          <span className="text-center text-sm text-brand-text/70">
            View rendered workflow artifacts, operating baselines, and startup-loop context.
          </span>
        </Link>

        <Link
          href="/boards/global"
          className="flex flex-col items-center gap-3 rounded-xl border border-brand-outline/30 bg-brand-surface p-8 shadow-sm transition-all hover:border-brand-primary/50 hover:shadow-md"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span className="text-lg font-semibold text-brand-heading">Legacy Board</span>
          <span className="text-center text-sm text-brand-text/70">
            Compatibility view for existing cards while workflow-first operations replace kanban usage.
          </span>
        </Link>
      </div>
    </main>
  );
}
