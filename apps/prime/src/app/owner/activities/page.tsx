import StaffOwnerDisabledNotice from '../../../components/security/StaffOwnerDisabledNotice';
import { canAccessStaffOwnerRoutes } from '../../../lib/security/staffOwnerGate';

import ActivitiesPageClient from './ActivitiesPageClient';

export default function ActivitiesPage() {
  if (!canAccessStaffOwnerRoutes()) {
    return <StaffOwnerDisabledNotice />;
  }

  return <ActivitiesPageClient />;
}
