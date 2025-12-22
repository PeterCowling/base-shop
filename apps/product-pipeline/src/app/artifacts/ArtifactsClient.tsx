"use client";

import { useCallback, useEffect, useState } from "react";
import ArtifactsUploadCard from "./ArtifactsUploadCard";
import ArtifactsList from "./ArtifactsList";
import type { ArtifactEntry, ArtifactsStrings } from "./types";

export default function ArtifactsClient({
  strings,
}: {
  strings: ArtifactsStrings;
}) {
  const [artifacts, setArtifacts] = useState<ArtifactEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadArtifacts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/artifacts?limit=50");
      if (!response.ok) return;
      const data = (await response.json()) as {
        ok?: boolean;
        artifacts?: ArtifactEntry[];
      };
      if (data.ok && Array.isArray(data.artifacts)) {
        setArtifacts(data.artifacts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadArtifacts();
  }, [loadArtifacts]);

  return (
    <div className="grid gap-6">
      <ArtifactsUploadCard strings={strings} onUploaded={loadArtifacts} />
      <ArtifactsList artifacts={artifacts} loading={loading} strings={strings} />
    </div>
  );
}
