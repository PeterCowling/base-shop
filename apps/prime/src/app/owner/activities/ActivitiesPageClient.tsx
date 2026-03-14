'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import ActivityManageForm from '../../../components/activity-manage/ActivityManageForm';
import type { ActivityInstance } from '../../../types/messenger/activity';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormMode = { mode: 'create' } | { mode: 'edit'; instance: ActivityInstance };
type PageState = 'loading' | 'error' | 'ready';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatStartTime(epochMs: number): string {
  return new Date(epochMs).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(durationMinutes?: number): string {
  if (durationMinutes === undefined || durationMinutes === null) {
    return '120 (default)';
  }
  return `${durationMinutes} min`;
}

const STATUS_LABELS: Record<ActivityInstance['status'], string> = {
  live: 'Live',
  upcoming: 'Upcoming',
  archived: 'Archived',
};

const STATUS_COLORS: Record<ActivityInstance['status'], string> = {
  live: 'bg-success-soft text-success-foreground',
  upcoming: 'bg-info-soft text-info-foreground',
  archived: 'bg-muted text-muted-foreground',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActivitiesPageClient() {
  const [instances, setInstances] = useState<ActivityInstance[]>([]);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [formOpen, setFormOpen] = useState<FormMode | null>(null);

  async function loadInstances() {
    setPageState('loading');
    setErrorMessage('');
    try {
      const res = await fetch('/api/activity-manage');
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Failed to load activities (${res.status})`);
      }
      const data = (await res.json()) as { instances: Record<string, ActivityInstance> };
      const list = Object.values(data.instances ?? {}).sort((a, b) => b.startTime - a.startTime);
      setInstances(list);
      setPageState('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load activities.');
      setPageState('error');
    }
  }

  useEffect(() => {
    void loadInstances();
  }, []);

  function handleFormSuccess() {
    setFormOpen(null);
    void loadInstances();
  }

  // -------------------------------------------------------------------------
  // Render: form open
  // -------------------------------------------------------------------------

  if (formOpen !== null) {
    const isCreate = formOpen.mode === 'create';
    const initialValues = formOpen.mode === 'edit' ? formOpen.instance : undefined;

    return (
      <main className="min-h-dvh bg-muted p-4">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setFormOpen(null)}
              className="text-sm text-primary hover:underline"
            >
              ← Back to activities
            </button>
          </div>
          <div className="rounded-xl bg-card p-6 shadow-sm">
            <h1 className="mb-6 text-xl font-bold text-foreground">
              {isCreate ? 'Create Activity' : 'Edit Activity'}
            </h1>
            <ActivityManageForm
              mode={isCreate ? 'create' : 'edit'}
              initialValues={initialValues}
              onSuccess={handleFormSuccess}
              onCancel={() => setFormOpen(null)}
            />
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------------------
  // Render: list view
  // -------------------------------------------------------------------------

  return (
    <main className="min-h-dvh bg-muted p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Activities</h1>
            <p className="text-sm text-muted-foreground">
              Manage activity instances shown to guests.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormOpen({ mode: 'create' })}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Create Activity
          </button>
        </div>

        {/* Error */}
        {pageState === 'error' && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {errorMessage}
            <button
              type="button"
              onClick={() => void loadInstances()}
              className="ms-2 font-medium underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {pageState === 'loading' && (
          <div className="rounded-xl bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
            Loading activities…
          </div>
        )}

        {/* Empty state */}
        {pageState === 'ready' && instances.length === 0 && (
          <div className="rounded-xl bg-card p-8 text-center shadow-sm">
            <p className="mb-4 text-sm text-muted-foreground">No activity instances yet.</p>
            <button
              type="button"
              onClick={() => setFormOpen({ mode: 'create' })}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Create your first activity
            </button>
          </div>
        )}

        {/* Instance list */}
        {pageState === 'ready' && instances.length > 0 && (
          <div className="space-y-3">
            {instances.map((instance) => (
              <div
                key={instance.id}
                className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground">{instance.title}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[instance.status]}`}
                    >
                      {STATUS_LABELS[instance.status]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    <span>Starts: {formatStartTime(instance.startTime)}</span>
                    <span>Duration: {formatDuration(instance.durationMinutes)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormOpen({ mode: 'edit', instance })}
                  className="ms-4 shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6">
          <Link href="/owner" className="text-sm text-primary hover:underline">
            ← Owner Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
