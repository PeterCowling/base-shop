import Link from "next/link";
import { notFound } from "next/navigation";

import { getIdeaById } from "@acme/platform-core/repositories/businessOs.server";

import { RunStatus } from "@/components/agent-runs/RunStatus";
import { MarkdownContent } from "@/components/card-detail/MarkdownContent";
import { CommentThread } from "@/components/comments/CommentThread";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { BUSINESSES } from "@/lib/business-catalog";
import { getCurrentUserServer } from "@/lib/current-user.server-only";
import { getDb } from "@/lib/d1.server";

import { ConvertToCardButton } from "./ConvertToCardButton";
import { WorkIdeaButton } from "./WorkIdeaButton";

// BOS-D1-05 Phase 2: Edge runtime with D1 repositories

// BOS-D1-05: Cache idea detail pages (1 minute acceptable for detail views)
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/* eslint-disable ds/no-hardcoded-copy, ds/no-unsafe-viewport-units, ds/enforce-layout-primitives, ds/container-widths-only-at -- BOS-12: Phase 0 scaffold UI */
// BOS-D1-05 Phase 2: Using D1 repositories (Edge runtime)
export default async function IdeaPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();
  const currentUser = await getCurrentUserServer();

  // Fetch idea data from D1
  const idea = await getIdeaById(db, id);
  if (!idea) {
    notFound();
  }

  // Get business info from hard-coded catalog
  const businessCode = idea.Business ?? "global";
  const business = BUSINESSES.find((b) => b.id === businessCode) ?? null;

  // TODO (BOS-D1-06): Re-enable comments via D1 comments table
  const comments: never[] = [];

  // Extract title from content
  const firstLine = idea.content.split("\n").find((line) => line.trim());
  const title = firstLine?.replace(/^#+\s*/, "") || idea.ID || "Untitled Idea";

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Ideas", href: "/ideas" },
    { label: idea.ID || "Idea" },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-panel border-b border-1 px-6 py-4">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/boards/${businessCode}`}
              className="text-sm font-medium text-muted hover:text-fg"
            >
              ← Back to Board
            </Link>
            {business && (
              <span className="text-sm text-muted">{business.name}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-secondary bg-panel border border-2 rounded-md hover:bg-surface-1"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Title and metadata */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-muted">{idea.ID}</span>
            <span className="text-xs px-2 py-0.5 bg-warning-soft text-warning-fg rounded font-medium">
              Idea
            </span>
            {idea.Status && (
              <span className="text-xs px-2 py-0.5 bg-info-soft text-info-fg rounded">
                {idea.Status}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-fg mb-2">{title}</h1>
          {idea.Tags && idea.Tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {idea.Tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-surface-1 text-secondary rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Agent run status - MVP-E4 */}
        <div className="mb-6">
          <RunStatus entityId={idea.ID || id} taskId={undefined} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Content */}
          <div className="lg:col-span-2">
            <div className="bg-panel rounded-lg border border-1 p-6">
              <MarkdownContent content={idea.content} />
            </div>
          </div>

          {/* Right column - Metadata */}
          <div className="space-y-6">
            <div className="bg-panel rounded-lg border border-1 p-4">
              <h3 className="text-sm font-semibold text-fg mb-3">
                Details
              </h3>
              <dl className="space-y-3">
                {idea.Business && (
                  <div>
                    <dt className="text-xs text-muted font-medium">
                      Business
                    </dt>
                    <dd className="text-sm text-fg mt-1">
                      {idea.Business}
                    </dd>
                  </div>
                )}
                {idea.Status && (
                  <div>
                    <dt className="text-xs text-muted font-medium">Status</dt>
                    <dd className="text-sm text-fg mt-1">{idea.Status}</dd>
                  </div>
                )}
                {idea["Created-Date"] && (
                  <div>
                    <dt className="text-xs text-muted font-medium">
                      Created
                    </dt>
                    <dd className="text-sm text-fg mt-1">
                      {new Date(idea["Created-Date"]).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Quick actions */}
            <div className="bg-panel rounded-lg border border-1 p-4">
              <h3 className="text-sm font-semibold text-fg mb-3">
                Actions
              </h3>
              <div className="space-y-2">
                <ConvertToCardButton ideaId={idea.ID || id} />
                <WorkIdeaButton
                  ideaId={idea.ID || id}
                  initialContent={idea.content}
                  initialStatus={idea.Status || "raw"}
                  baseFileSha={idea.fileSha}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Comments - MVP-E1 */}
        <div className="mt-6">
          <CommentThread
            comments={comments}
            entityType="idea"
            entityId={idea.ID || id}
            currentUserName={currentUser.name}
          />
        </div>
      </div>
    </div>
  );
}
