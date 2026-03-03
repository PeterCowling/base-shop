/**
 * EtaConfirmation.tsx
 *
 * Component for confirming guest arrival time and travel method.
 */

'use client';

import { type FC, memo, type ReactNode, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Anchor,
  ArrowLeft,
  Bus,
  Car,
  Check,
  Clock,
  MessageSquare,
  Plane,
  Train,
} from 'lucide-react';

import type { EtaMethod } from '../../types/preArrival';

interface EtaConfirmationProps {
  /** Currently saved ETA window */
  currentEtaWindow?: string | null;
  /** Currently saved ETA method */
  currentEtaMethod?: EtaMethod | null;
  /** Currently saved ETA note */
  currentEtaNote?: string;
  /** Handler for confirming ETA */
  onConfirm: (window: string, method: EtaMethod, note?: string) => void;
  /** Handler to go back */
  onBack?: () => void;
  /** Handler for skipping this step */
  onSkip?: () => void;
  /** Current step number in the pre-arrival flow */
  stepNumber?: number;
  /** Total steps in the pre-arrival flow */
  totalSteps?: number;
}

/**
 * Generate time slots in 30-min increments.
 */
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 6; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }
  // Add midnight as final option
  slots.push('00:00');
  return slots;
}

/**
 * Format time slot for display (e.g., "18:00" -> "18:00-18:30").
 */
function formatTimeSlot(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const endHours = minutes === 30 ? hours + 1 : hours;
  const endMinutes = minutes === 30 ? 0 : 30;
  const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  return `${time} - ${endTime}`;
}

/**
 * Check if time is late (after 22:00).
 */
function isLateArrival(time: string): boolean {
  const [hours] = time.split(':').map(Number);
  return hours >= 22 || hours === 0;
}

/**
 * Travel method options with icons.
 */
const TRAVEL_METHODS: { method: EtaMethod; icon: ReactNode }[] = [
  { method: 'ferry', icon: <Anchor className="h-5 w-5" /> },
  { method: 'bus', icon: <Bus className="h-5 w-5" /> },
  { method: 'train', icon: <Train className="h-5 w-5" /> },
  { method: 'taxi', icon: <Car className="h-5 w-5" /> },
  { method: 'private', icon: <Plane className="h-5 w-5" /> },
  { method: 'other', icon: <MessageSquare className="h-5 w-5" /> },
];

const TIME_SLOTS = generateTimeSlots();

export const EtaConfirmation: FC<EtaConfirmationProps> = memo(
  function EtaConfirmation({
    currentEtaWindow,
    currentEtaMethod,
    currentEtaNote = '',
    onConfirm,
    onBack,
    onSkip,
    stepNumber = 2,
    totalSteps = 5,
  }) {
    const { t } = useTranslation('PreArrival');

    // State
    const [selectedTime, setSelectedTime] = useState<string | null>(
      currentEtaWindow ?? null,
    );
    const [selectedMethod, setSelectedMethod] = useState<EtaMethod | null>(
      currentEtaMethod ?? null,
    );
    const [note, setNote] = useState(currentEtaNote);

    // Check if form is valid
    const isValid = useMemo(
      () => selectedTime !== null && selectedMethod !== null,
      [selectedTime, selectedMethod],
    );

    // Check if selected time is late
    const showLateWarning = useMemo(
      () => selectedTime && isLateArrival(selectedTime),
      [selectedTime],
    );

    // Handle confirm
    const handleConfirm = useCallback(() => {
      if (selectedTime && selectedMethod) {
        onConfirm(selectedTime, selectedMethod, note || undefined);
      }
    }, [selectedTime, selectedMethod, note, onConfirm]);

    return (
      <div className="flex flex-col gap-6">
        {/* Navigation + Progress */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex size-11 items-center justify-center rounded-full bg-muted hover:bg-muted/70 active:bg-muted/60"
                aria-label={t('eta.back')}
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {t('eta.stepProgress', { current: stepNumber, total: totalSteps })}
            </span>
          </div>

          {/* Segmented progress bar */}
          {/* eslint-disable-next-line ds/enforce-layout-primitives -- PLAT-ENG-0001 segmented progress bar */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < stepNumber ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Header - task-focused, no repeated welcome */}
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {t('eta.title')}
          </h2>
          <p className="mt-1 text-sm text-foreground/70">{t('eta.subtitle')}</p>
        </div>

        {/* Time selection */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4" />
            {t('eta.timeLabel')}
            {/* eslint-disable-next-line ds/no-raw-typography, ds/no-arbitrary-tailwind -- PLAT-ENG-0001 required badge */}
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t('eta.required')}
            </span>
          </label>
          {/* eslint-disable-next-line ds/enforce-layout-primitives -- PLAT-ENG-0001 time slot grid */}
          <div className="grid grid-cols-4 gap-2">
            {TIME_SLOTS.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`
                  rounded-lg px-3 py-2 text-sm font-medium
                  transition-colors
                  ${
                    selectedTime === time
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }
                `}
              >
                {time}
              </button>
            ))}
          </div>
          {selectedTime && (
            <p className="mt-2 text-sm text-muted-foreground">
              {formatTimeSlot(selectedTime)}
            </p>
          )}
        </div>

        {/* Late arrival warning */}
        {showLateWarning && (
          <div className="rounded-xl bg-warning-soft p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning-foreground" />
              <div>
                <p className="font-medium text-warning-foreground">
                  {t('eta.lateArrival.title')}
                </p>
                <p className="mt-1 text-sm text-warning-foreground">
                  {t('eta.lateArrival.message')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Travel method selection */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            {t('eta.methodLabel')}
            {/* eslint-disable-next-line ds/no-raw-typography, ds/no-arbitrary-tailwind -- PLAT-ENG-0001 required badge */}
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t('eta.required')}
            </span>
          </label>
          {/* eslint-disable-next-line ds/enforce-layout-primitives -- PLAT-ENG-0001 travel method grid */}
          <div className="grid grid-cols-3 gap-2">
            {TRAVEL_METHODS.map(({ method, icon }) => (
              <button
                key={method}
                type="button"
                onClick={() => setSelectedMethod(method)}
                className={`
                  flex flex-col items-center gap-2 rounded-xl p-4
                  transition-colors
                  ${
                    selectedMethod === method
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }
                `}
              >
                {icon}
                <span className="text-xs font-medium">
                  {t(`eta.methods.${method}`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Note field */}
        <div>
          <label
            htmlFor="eta-note"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {t('eta.noteLabel')}
          </label>
          {/* eslint-disable ds/enforce-focus-ring-token -- PLAT-ENG-0001 textarea focus style */}
          <textarea
            id="eta-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder={t('eta.notePlaceholder')}
            rows={3}
            maxLength={200}
            className="w-full resize-none rounded-xl border bg-card p-3 text-sm transition-colors focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
          {/* eslint-enable ds/enforce-focus-ring-token */}
          <p className="mt-1 text-end text-xs text-muted-foreground">{note.length}/200</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {/* Primary CTA */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid}
            className={`
              flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium
              transition-colors
              ${
                isValid
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'cursor-not-allowed bg-muted text-muted-foreground'
              }
            `}
          >
            <Check className="h-5 w-5" />
            {t('eta.confirm')}
          </button>

          {/* Skip action */}
          {/* eslint-disable ds/min-tap-size -- PLAT-ENG-0001 full-width skip button */}
          {(onSkip ?? onBack) && (
            <button
              type="button"
              onClick={onSkip ?? onBack}
              className="min-h-11 w-full rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t('eta.skip')}
            </button>
          )}
          {/* eslint-enable ds/min-tap-size */}
        </div>

        {/* Helper text */}
        <p className="text-center text-xs text-muted-foreground">
          {t('eta.helperText')}
        </p>
      </div>
    );
  },
);

export default EtaConfirmation;
