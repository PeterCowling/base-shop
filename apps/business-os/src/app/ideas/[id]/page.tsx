import Link from "next/link";
import { notFound } from "next/navigation";

import { RunStatus } from "@/components/agent-runs/RunStatus";
import { MarkdownContent } from "@/components/card-detail/MarkdownContent";
import { CommentThread } from "@/components/comments/CommentThread";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { getCurrentUserServer } from "@/lib/current-user";
import { getRepoRoot } from "@/lib/get-repo-root";
import { getCommentsForEntity } from "@/lib/repo/CommentReader";
import { createRepoReader } from "@/lib/repo-reader";

import { ConvertToCardButton } from "./ConvertToCardButton";
import { WorkIdeaButton } from "./WorkIdeaButton";

// BOS-D1-05: Prepare for Edge runtime (Cloudflare Pages deployment)
// Currently using Node runtime with RepoReader (filesystem + git)
// TODO: Migrate to D1 repositories in BOS-D1-06
export const runtime = "nodejs"; // Will change to "edge" after D1 migration

// BOS-D1-05: Cache idea detail pages (1 minute acceptable for detail views)
export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

/* eslint-disable ds/no-hardcoded-copy, ds/no-unsafe-viewport-units, ds/enforce-layout-primitives, ds/container-widths-only-at -- BOS-12: Phase 0 scaffold UI */
// Phase 0: Local-only, Pete-only. No auth needed.
// BOS-D1-05: Using RepoReader (git-based) until D1 migration complete
export default async function IdeaPage({ params }: PageProps) {
  const { id } = await params;
  const repoRoot = getRepoRoot();
  const reader = createRepoReader(repoRoot);
  const currentUser = await getCurrentUserServer();

  // Fetch idea data
  const idea = await reader.getIdea(id);
  if (!idea) {
    notFound();
  }

  // Fetch business info
  const business = idea.Business
    ? await reader.getBusiness(idea.Business)
    : null;

  // Fetch comments for this idea (MVP-E1)
  const comments = await getCommentsForEntity(repoRoot, "idea", id);

  // Extract title from content
  const firstLine = idea.content.split("\n").find((line) => line.trim());
  const title = firstLine?.replace(/^#+\s*/, "") || idea.ID || "Untitled Idea";

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Ideas", href: "/" },
    { label: idea.ID || "Idea" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href={idea.Business ? `/boards/${idea.Business}` : "/boards/global"}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              ← Back to Board
            </Link>
            {business && (
              <span className="text-sm text-gray-500">{business.name}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Title and metadata */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-gray-600">{idea.ID}</span>
            <span className="text-xs px-2 py-0.5 bg-yellow-200 text-yellow-900 rounded font-medium">
              Idea
            </span>
            {idea.Status && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                {idea.Status}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          {idea.Tags && idea.Tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {idea.Tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <MarkdownContent content={idea.content} />
            </div>
          </div>

          {/* Right column - Metadata */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Details
              </h3>
              <dl className="space-y-3">
                {idea.Business && (
                  <div>
                    <dt className="text-xs text-gray-500 font-medium">
                      Business
                    </dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {idea.Business}
                    </dd>
                  </div>
                )}
                {idea.Status && (
                  <div>
                    <dt className="text-xs text-gray-500 font-medium">Status</dt>
                    <dd className="text-sm text-gray-900 mt-1">{idea.Status}</dd>
                  </div>
                )}
                {idea["Created-Date"] && (
                  <div>
                    <dt className="text-xs text-gray-500 font-medium">
                      Created
                    </dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {new Date(idea["Created-Date"]).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
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
