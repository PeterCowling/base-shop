import { AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react';
import { memo, type FC } from 'react';
import type { GuestKeycardStatus } from '../../lib/preArrival/keycardStatus';

interface KeycardStatusProps {
  status: GuestKeycardStatus;
  className?: string;
}

export const KeycardStatus: FC<KeycardStatusProps> = memo(function KeycardStatus({
  status,
  className = '',
}) {
  if (status.state === 'issued') {
    return (
      <section className={`rounded-xl bg-green-50 p-4 ${className}`} aria-label="keycard-status-issued">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <p className="text-sm font-semibold">Keycard issued</p>
        </div>
        <p className="mt-1 text-sm text-green-800">
          Your room keycard is active. Keep it with you for room and entry access.
        </p>
      </section>
    );
  }

  if (status.state === 'lost') {
    return (
      <section className={`rounded-xl bg-amber-50 p-4 ${className}`} aria-label="keycard-status-lost">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-semibold">Keycard support needed</p>
        </div>
        <p className="mt-1 text-sm text-amber-800">
          If your keycard is missing, go to reception immediately for deactivation and replacement.
        </p>
      </section>
    );
  }

  return (
    <section className={`rounded-xl bg-blue-50 p-4 ${className}`} aria-label="keycard-status-pending">
      <div className="flex items-center gap-2 text-blue-700">
        <CreditCard className="h-4 w-4" />
        <p className="text-sm font-semibold">Keycard will be issued at check-in</p>
      </div>
      <p className="mt-1 text-sm text-blue-800">
        Bring your ID and the reception team will activate your card on arrival.
      </p>
    </section>
  );
});

export default KeycardStatus;
