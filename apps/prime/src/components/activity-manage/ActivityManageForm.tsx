'use client';

import { useState } from 'react';

import type { ActivityInstance } from '../../types/messenger/activity';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActivityManageFormProps {
  mode: 'create' | 'edit';
  initialValues?: Partial<ActivityInstance>;
  onSuccess: () => void;
  onCancel?: () => void;
}

interface FormState {
  title: string;
  startTime: string; // datetime-local string "YYYY-MM-DDTHH:mm"
  durationMinutes: string; // string for number input control
  status: 'live' | 'upcoming' | 'archived';
  description: string;
  meetUpPoint: string;
  meetUpTime: string;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function epochToDatetimeLocal(epochMs: number): string {
  const date = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function datetimeLocalToEpoch(value: string): number {
  return new Date(value).getTime();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActivityManageForm({
  mode,
  initialValues,
  onSuccess,
  onCancel,
}: ActivityManageFormProps) {
  const [form, setForm] = useState<FormState>({
    title: initialValues?.title ?? '',
    startTime: initialValues?.startTime ? epochToDatetimeLocal(initialValues.startTime) : '',
    durationMinutes: String(initialValues?.durationMinutes ?? 60),
    status: initialValues?.status ?? 'upcoming',
    description: initialValues?.description ?? '',
    meetUpPoint: initialValues?.meetUpPoint ?? '',
    meetUpTime: initialValues?.meetUpTime ?? '',
  });
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const isSubmitting = submitState === 'submitting';

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Client-side validation
    const duration = Number(form.durationMinutes);
    if (!Number.isInteger(duration) || duration < 1) {
      setErrorMessage('Duration must be a whole number of at least 1 minute.');
      return;
    }
    if (!form.title.trim()) {
      setErrorMessage('Title is required.');
      return;
    }
    if (!form.startTime) {
      setErrorMessage('Start time is required.');
      return;
    }

    setSubmitState('submitting');
    setErrorMessage('');

    const sharedFields = {
      title: form.title.trim(),
      startTime: datetimeLocalToEpoch(form.startTime),
      durationMinutes: duration,
      status: form.status,
      ...(form.description.trim() && { description: form.description.trim() }),
      ...(form.meetUpPoint.trim() && { meetUpPoint: form.meetUpPoint.trim() }),
      ...(form.meetUpTime.trim() && { meetUpTime: form.meetUpTime.trim() }),
    };

    const payload =
      mode === 'create'
        ? { templateId: initialValues?.templateId ?? 'manual', ...sharedFields }
        : { id: initialValues?.id, ...sharedFields };

    try {
      const response = await fetch('/api/activity-manage', {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${response.status})`);
      }

      setSubmitState('success');
      onSuccess();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'An error occurred. Please try again.',
      );
      setSubmitState('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <label htmlFor="activity-title" className="text-sm font-medium text-foreground">
          Title <span className="text-destructive">*</span>
        </label>
        <input
          id="activity-title"
          type="text"
          required
          disabled={isSubmitting}
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="e.g. Sunset Boat Tour"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary disabled:opacity-50"
        />
      </div>

      {/* Start time */}
      <div className="space-y-1.5">
        <label htmlFor="activity-start-time" className="text-sm font-medium text-foreground">
          Start Time <span className="text-destructive">*</span>
        </label>
        <input
          id="activity-start-time"
          type="datetime-local"
          required
          disabled={isSubmitting}
          value={form.startTime}
          onChange={(e) => setField('startTime', e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary disabled:opacity-50"
        />
      </div>

      {/* Duration */}
      <div className="space-y-1.5">
        <label htmlFor="activity-duration" className="text-sm font-medium text-foreground">
          Duration (minutes) <span className="text-destructive">*</span>
        </label>
        <input
          id="activity-duration"
          type="number"
          required
          min={1}
          step={1}
          disabled={isSubmitting}
          value={form.durationMinutes}
          onChange={(e) => setField('durationMinutes', e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary disabled:opacity-50"
        />
        <p className="text-xs text-muted-foreground">
          Guests will see this as the activity end time. Default is 60 minutes.
        </p>
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <label htmlFor="activity-status" className="text-sm font-medium text-foreground">
          Status <span className="text-destructive">*</span>
        </label>
        <select
          id="activity-status"
          required
          disabled={isSubmitting}
          value={form.status}
          onChange={(e) => setField('status', e.target.value as FormState['status'])}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary disabled:opacity-50"
        >
          <option value="upcoming">Upcoming</option>
          <option value="live">Live</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Description (optional) */}
      <div className="space-y-1.5">
        <label htmlFor="activity-description" className="text-sm font-medium text-foreground">
          Description
          <span className="ms-1 text-xs text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="activity-description"
          disabled={isSubmitting}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary disabled:opacity-50"
        />
      </div>

      {/* Meet-up Point (optional) */}
      <div className="space-y-1.5">
        <label htmlFor="activity-meetup-point" className="text-sm font-medium text-foreground">
          Meet-up Point
          <span className="ms-1 text-xs text-muted-foreground">(optional)</span>
        </label>
        <input
          id="activity-meetup-point"
          type="text"
          disabled={isSubmitting}
          value={form.meetUpPoint}
          onChange={(e) => setField('meetUpPoint', e.target.value)}
          placeholder="e.g. Hotel lobby"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary disabled:opacity-50"
        />
      </div>

      {/* Meet-up Time (optional) */}
      <div className="space-y-1.5">
        <label htmlFor="activity-meetup-time" className="text-sm font-medium text-foreground">
          Meet-up Time
          <span className="ms-1 text-xs text-muted-foreground">(HH:mm, optional)</span>
        </label>
        <input
          id="activity-meetup-time"
          type="text"
          disabled={isSubmitting}
          value={form.meetUpTime}
          onChange={(e) => setField('meetUpTime', e.target.value)}
          placeholder="e.g. 18:45"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary disabled:opacity-50"
        />
      </div>

      {/* Error */}
      {errorMessage && (
        <div
          role="alert"
          data-cy="activity-form-error"
          className="rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Activity' : 'Save Changes'}
        </button>
        {onCancel && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
