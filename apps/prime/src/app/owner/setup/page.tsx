import Link from 'next/link';
import { Settings } from 'lucide-react';

import ActivationFunnelSummary from '../../../components/owner/ActivationFunnelSummary';
import StaffOwnerDisabledNotice from '../../../components/security/StaffOwnerDisabledNotice';
import { canAccessStaffOwnerRoutes } from '../../../lib/security/staffOwnerGate';

export default function OwnerSetupPage() {
  if (!canAccessStaffOwnerRoutes()) {
    return <StaffOwnerDisabledNotice />;
  }

  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
            <Settings className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Owner Setup</h1>
            <p className="text-sm text-muted-foreground">Property configuration</p>
          </div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-sm">
          <p className="mb-4 text-muted-foreground">
            Owner setup now includes live activation analytics from guest flows.
          </p>
          <ActivationFunnelSummary />
          <Link
            href="/"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
