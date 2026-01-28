import { notFound } from "next/navigation";

import { CardDetail } from "@/components/card-detail/CardDetail";
import { getFileHistory, getGitHubHistoryUrl } from "@/lib/git-history";
import { createRepoReader } from "@/lib/repo-reader";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Phase 0: Local-only, Pete-only. No auth needed.
export default async function CardPage({ params }: PageProps) {
  const { id } = await params;
  const repoRoot = process.cwd().replace(/\/apps\/business-os$/, "");
  const reader = createRepoReader(repoRoot);

  // Fetch card data
  const card = await reader.getCard(id);
  if (!card) {
    notFound();
  }

  // Fetch stage docs
  const stageDocs = await reader.getCardStageDocs(id);

  // Fetch business info
  const business = card.Business
    ? await reader.getBusiness(card.Business)
    : null;

  // Fetch git history (BOS-28)
  const cardFilePath = `docs/business-os/cards/${id}.user.md`;
  const history = await getFileHistory(repoRoot, cardFilePath);
  const githubUrl = history.length > 0 ? getGitHubHistoryUrl(cardFilePath) : undefined;

  return (
    <CardDetail
      card={card}
      stageDocs={stageDocs}
      business={business}
      history={history}
      githubUrl={githubUrl}
    />
  );
}
