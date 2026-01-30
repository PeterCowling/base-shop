import { createRepoReader } from "./repo-reader";

export type ConcurrencyOk = { ok: true };
export type ConcurrencyConflict = {
  ok: false;
  reason: "baseFileShaMismatch";
  currentFileSha: string;
};

export type ConcurrencyResult = ConcurrencyOk | ConcurrencyConflict;

export async function checkCardBaseFileSha(params: {
  repoRoot: string;
  cardId: string;
  baseFileSha?: string;
}): Promise<ConcurrencyResult> {
  const { repoRoot, cardId, baseFileSha } = params;

  if (!baseFileSha) {
    return { ok: true };
  }

  const reader = createRepoReader(repoRoot);
  const current = await reader.getCard(cardId);
  if (!current?.fileSha) {
    return { ok: true };
  }

  if (current.fileSha !== baseFileSha) {
    return {
      ok: false,
      reason: "baseFileShaMismatch",
      currentFileSha: current.fileSha,
    };
  }

  return { ok: true };
}

