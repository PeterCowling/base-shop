'use client';

// Component for lazy loading i18n namespaces
// Wraps route components to load required translations on-demand

import { loadNamespaceGroup, NAMESPACE_GROUPS } from '@/i18n.optimized';
import { useEffect, useState } from 'react';

interface LazyTranslationsProps {
  namespaceGroup: keyof typeof NAMESPACE_GROUPS;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyTranslations({
  namespaceGroup,
  children,
  fallback = <div>Loading translations...</div>,
}: LazyTranslationsProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadNamespaceGroup(namespaceGroup)
      .then(() => {
        setLoaded(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error('Failed to load translations'));
      });
  }, [namespaceGroup]);

  if (error) {
    console.error('Translation loading error:', error);
    // Still render children even if translations fail
    return <>{children}</>;
  }

  if (!loaded) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Hook for programmatically loading namespace groups
export function useNamespaceGroup(group: keyof typeof NAMESPACE_GROUPS) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadNamespaceGroup(group)
      .then(() => {
        setLoaded(true);
      })
      .catch((err) => {
        console.error(`Failed to load namespace group ${group}:`, err);
      });
  }, [group]);

  return loaded;
}
