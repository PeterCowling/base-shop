"use client";

import { useEffect, useMemo, useState } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import PreviewPane from "./PreviewPane";
import VersionList from "./versions-panel/VersionList";
import CreateVersionForm from "./versions-panel/CreateVersionForm";
import DiffSummaryView from "./versions-panel/DiffSummary";
import DiffDetails from "./versions-panel/DiffDetails";
import RenameDeleteControls from "./versions-panel/RenameDeleteControls";
import ExperimentForm from "./versions-panel/ExperimentForm";
import SchedulePublishForm from "./versions-panel/SchedulePublishForm";
import PreviewLinkForm from "./versions-panel/PreviewLinkForm";
import {
  createPreviewLinkApi,
  createVersionApi,
  deleteVersion as deleteVersionApi,
  fetchVersions,
  renameVersion as renameVersionApi,
  schedulePublishApi,
  createExperimentApi,
} from "./versions-panel/api";
import type { VersionEntry } from "./versions-panel/api";
import { computeDiffSummary } from "./versions-panel/diff";
import { Button } from "../../atoms/shadcn";

interface Props {
  shop: string;
  pageId: string;
  current: PageComponent[];
  editor?: HistoryState["editor"];
  onRestore: (components: PageComponent[]) => void;
  autoFocusLabel?: boolean;
}

export default function VersionsPanel({ shop, pageId, current, editor, onRestore, autoFocusLabel = false }: Props) {
  const [versions, setVersions] = useState<VersionEntry[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => versions?.find((v) => v.id === selectedId) ?? null, [versions, selectedId]);
  const diffSummary = useMemo(() => computeDiffSummary(current, selected?.components ?? null), [current, selected]);

  const load = async () => {
    try {
      setError(null);
      const data = await fetchVersions(shop, pageId);
      setVersions(data);
      if (data.length && !selectedId) setSelectedId(data[0].id);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, pageId]);

  const handleCreateVersion = async (label: string) => {
    try {
      setError(null);
      await createVersionApi({ shop, pageId, label, components: current, editor });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleRename = async (newLabel: string) => {
    if (!selectedId) return;
    try {
      setError(null);
      await renameVersionApi(shop, pageId, selectedId, newLabel);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!window.confirm("Delete selected version?")) return;
    try {
      setError(null);
      await deleteVersionApi(shop, pageId, selectedId);
      setSelectedId(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCreateExperiment = async (label: string | undefined, splitA: number) => {
    if (!selectedId) return;
    try {
      setError(null);
      await createExperimentApi(shop, pageId, selectedId, { label, splitA });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleSchedulePublish = async (publishAt: string) => {
    if (!selectedId) return;
    try {
      setError(null);
      await schedulePublishApi(shop, pageId, selectedId, publishAt);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCreatePreviewLink = async (password?: string) => {
    if (!selectedId) return "";
    try {
      setError(null);
      const url = await createPreviewLinkApi(shop, pageId, selectedId, password);
      return url;
    } catch (err) {
      setError((err as Error).message);
      return "";
    }
  };

  return (
    <div className="space-y-3">
      <CreateVersionForm onCreate={handleCreateVersion} autoFocusLabel={autoFocusLabel} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        <VersionList versions={versions} selectedId={selectedId} onSelect={setSelectedId} />
        <div className="col-span-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-sm font-medium mb-1">Current</div>
              <PreviewPane components={current} locale="en" deviceId="desktop" onChange={() => {}} editor={editor} />
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Selected</div>
              <div className="rounded border min-h-10">
                {selected ? (
                  <PreviewPane components={selected.components} locale="en" deviceId="desktop" onChange={() => {}} editor={selected.editor} />
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">Select a version to preview</div>
                )}
              </div>
            </div>
          </div>
          <DiffSummaryView diff={diffSummary} />
          <DiffDetails diff={diffSummary} current={current} onRestore={onRestore} />
          <div className="flex items-center justify-between gap-2">
            <RenameDeleteControls selected={selected} onRename={handleRename} onDelete={handleDelete} />
            <Button
              variant="outline"
              onClick={() => selected && onRestore(selected.components)}
              disabled={!selected}
            >
              Restore Selected
            </Button>
          </div>
          {selected && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <ExperimentForm onCreate={handleCreateExperiment} />
              <SchedulePublishForm onSchedule={handleSchedulePublish} />
              <PreviewLinkForm onCreate={handleCreatePreviewLink} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
