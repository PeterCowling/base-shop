/**
 * EtaConfirmation.tsx
 *
 * Component for confirming guest arrival time and travel method.
 */

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
        {/* Header */}
        <div className="flex items-start gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-1 rounded-full p-2 hover:bg-gray-100"
              aria-label={t('eta.back')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('eta.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{t('eta.subtitle')}</p>
          </div>
        </div>

        {/* Time selection */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Clock className="h-4 w-4" />
            {t('eta.timeLabel')}
          </label>
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {time}
              </button>
            ))}
          </div>
          {selectedTime && (
            <p className="mt-2 text-sm text-gray-500">
              {formatTimeSlot(selectedTime)}
            </p>
          )}
        </div>

        {/* Late arrival warning */}
        {showLateWarning && (
          <div className="rounded-xl bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
              <div>
                <p className="font-medium text-amber-800">
                  {t('eta.lateArrival.title')}
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  {t('eta.lateArrival.message')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Travel method selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {t('eta.methodLabel')}
          </label>
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            {t('eta.noteLabel')}
          </label>
          <textarea
            id="eta-note"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder={t('eta.notePlaceholder')}
            rows={3}
            maxLength={200}
            className="w-full resize-none rounded-xl border bg-white p-3 text-sm transition-colors focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-end text-xs text-gray-400">{note.length}/200</p>
        </div>

        {/* Confirm button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValid}
          className={`
            flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium
            transition-colors
            ${
              isValid
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'cursor-not-allowed bg-gray-200 text-gray-400'
            }
          `}
        >
          <Check className="h-5 w-5" />
          {t('eta.confirm')}
        </button>
      </div>
    );
  },
);

export default EtaConfirmation;
