export type ArtifactEntry = {
  id: string;
  candidateId: string | null;
  stageRunId: string | null;
  kind: string | null;
  uri: string | null;
  checksum: string | null;
  createdAt: string | null;
  stage: string | null;
  stageStatus: string | null;
  lead: {
    id: string;
    title: string | null;
  } | null;
};

export type ArtifactsStrings = {
  upload: {
    label: string;
    title: string;
    candidateLabel: string;
    stageRunLabel: string;
    kindLabel: string;
    fileLabel: string;
    submitLabel: string;
    loadingCandidates: string;
    loadingRuns: string;
    emptyRuns: string;
    successMessage: string;
    errorMessage: string;
  };
  list: {
    label: string;
    title: string;
    empty: string;
    loading: string;
  };
  fields: {
    candidate: string;
    stage: string;
    kind: string;
    created: string;
    uri: string;
  };
  actions: {
    open: string;
    viewCandidate: string;
  };
  stageLabels: Record<string, string>;
  notAvailable: string;
};

export type CandidateOption = {
  id: string;
  label: string;
};

export type StageRunOption = {
  id: string;
  label: string;
};

export function resolveArtifactHref(uri: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith("http")) return uri;
  if (!uri.startsWith("r2://")) return null;
  const parts = uri.split("/");
  if (parts.length < 4) return null;
  const key = parts.slice(3).join("/");
  return `/api/artifacts/download?key=${encodeURIComponent(key)}`;
}

export function safeTimestamp(value: string | null, fallback: string): string {
  return value ?? fallback;
}
