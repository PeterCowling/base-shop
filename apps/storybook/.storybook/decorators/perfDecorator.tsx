import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Decorator } from '@storybook/react';

function PerfProbe({ children }: { children: React.ReactNode }) {
  const renders = useRef(0);
  const [lastMs, setLastMs] = useState<number | null>(null);
  // Measure the first render paint only to avoid update loops
  const start = useMemo(() => performance.now(), []);
  renders.current += 1;
  useLayoutEffect(() => {
    const end = performance.now();
    setLastMs(end - start);
    console.debug(`[perf] render #${renders.current} in ${Math.round((end - start) * 10) / 10}ms`);
  }, [start]);
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 9999,
          padding: 'var(--space-1) var(--space-2)',
          borderRadius: 6,
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          fontSize: 12,
          lineHeight: 1.2,
          pointerEvents: 'none',
        }}
        aria-label="perf-probe"
      >
        <div>renders: {renders.current}</div>
        <div>last: {lastMs != null ? `${Math.round(lastMs * 10) / 10}ms` : '—'}</div>
      </div>
      {children}
    </div>
  );
}

export const withPerf: Decorator = (Story, context) => {
  const perfParam = (context.parameters as Record<string, unknown>)?.['perf'];
  const perf = perfParam === true;
  if (!perf || perf === false) return <Story />;
  return (
    <PerfProbe>
      <Story />
    </PerfProbe>
  );
};
