'use client';

import GuardedRouteRedirect from '../../../components/navigation/GuardedRouteRedirect';

export default function BarMenuPage() {
  const targetPath = '/complimentary-evening-drink';

  return <GuardedRouteRedirect targetPath={targetPath} />;
}
