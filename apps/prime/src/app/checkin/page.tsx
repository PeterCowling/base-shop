'use client';

import dynamic from 'next/dynamic';
import StaffOwnerDisabledNotice from '../../components/security/StaffOwnerDisabledNotice';
import { canAccessStaffOwnerRoutes } from '../../lib/security/staffOwnerGate';

const CheckInClient = dynamic(() => import('./CheckInClient'), { ssr: false });

export default function CheckInPage() {
  if (!canAccessStaffOwnerRoutes()) {
    return <StaffOwnerDisabledNotice />;
  }

  return <CheckInClient />;
}
