import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/card-detail/MarkdownContent";
import { Breadcrumb } from "@/components/navigation/Breadcrumb";
import { createRepoReader } from "@/lib/repo-reader";

interface PageProps {
  params: Promise<{ id: string }>;
}

/* eslint-disable ds/no-hardcoded-copy, ds/no-unsafe-viewport-units, ds/enforce-layout-primitives, ds/container-widths-only-at, ds/min-tap-size -- BOS-12: Phase 0 scaffold UI */
// Phase 0: Local-only, Pete-only. No auth needed.
export default async function IdeaPage({ params }: PageProps) {
  const { id } = await params;
  const repoRoot = process.cwd().replace(/\/apps\/business-os$/, "");
  const reader = createRepoReader(repoRoot);

  // Fetch idea data
  const idea = await reader.getIdea(id);
  if (!idea) {
    notFound();
  }

  // Fetch business info
  const business = idea.Business
    ? await reader.getBusiness(idea.Business)
    : null;

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
                <button
                  type="button"
                  className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100"
                  disabled
                >
                  Work Idea (Coming Soon)
                </button>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100"
                  disabled
                >
                  Convert to Card (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
