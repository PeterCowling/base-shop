'use client';

import GuardedRouteRedirect from '../../../components/navigation/GuardedRouteRedirect';

export default function BreakfastMenuPage() {
  const targetPath = '/complimentary-breakfast';

  return <GuardedRouteRedirect targetPath={targetPath} />;
}
