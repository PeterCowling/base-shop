import { memo } from "react";

import { PageShell } from "../common/PageShell";

interface PreparePageProps {
  dateSelector: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Layout wrapper for the Prepare screen.
 * Provides the PageShell gradient backdrop + accent-bar heading and an inner
 * card holding the DateSelector and path-specific content.
 */
const PreparePage = memo(function PreparePage({
  dateSelector,
  children,
}: PreparePageProps) {
  return (
    <PageShell title="PREPARE">
      <div className="flex-grow bg-surface rounded-lg shadow-lg p-6 space-y-4">
        {dateSelector}
        {children}
      </div>
    </PageShell>
  );
});

export default PreparePage;
