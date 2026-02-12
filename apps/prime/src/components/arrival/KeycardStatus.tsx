import { type FC,memo } from 'react';
import { AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react';

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
      <section className={`rounded-xl bg-success-soft p-4 ${className}`} aria-label="keycard-status-issued">
        <div className="flex items-center gap-2 text-success-foreground">
          <CheckCircle2 className="h-4 w-4" />
          <p className="text-sm font-semibold">Keycard issued</p>
        </div>
        <p className="mt-1 text-sm text-success-foreground">
          Your room keycard is active. Keep it with you for room and entry access.
        </p>
      </section>
    );
  }

  if (status.state === 'lost') {
    return (
      <section className={`rounded-xl bg-warning-soft p-4 ${className}`} aria-label="keycard-status-lost">
        <div className="flex items-center gap-2 text-warning-foreground">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-semibold">Keycard support needed</p>
        </div>
        <p className="mt-1 text-sm text-warning-foreground">
          If your keycard is missing, go to reception immediately for deactivation and replacement.
        </p>
      </section>
    );
  }

  return (
    <section className={`rounded-xl bg-info-soft p-4 ${className}`} aria-label="keycard-status-pending">
      <div className="flex items-center gap-2 text-info-foreground">
        <CreditCard className="h-4 w-4" />
        <p className="text-sm font-semibold">Keycard will be issued at check-in</p>
      </div>
      <p className="mt-1 text-sm text-info-foreground">
        Bring your ID and the reception team will activate your card on arrival.
      </p>
    </section>
  );
});

export default KeycardStatus;
