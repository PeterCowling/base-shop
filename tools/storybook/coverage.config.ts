/* i18n-exempt file -- ENG-1234 Non-UI config: globs and policy labels [ttl=2025-12-31] */
export type Bucket =
  | 'atoms'
  | 'molecules'
  | 'organisms'
  | 'cms-blocks'
  | 'templates'
  | 'layout'
  | 'other';

export interface BucketPolicy {
  requireDefault: boolean;
  requireLoading: boolean;
  requireEmpty: boolean;
  requireError: boolean;
  requireRTL: boolean; // RTL sample required
  // Optional: require at least one mobile viewport sample (applies to Matrix stories via verifier)
  requireMobile?: boolean;
}

export const bucketGlobs: Record<Bucket, string[]> = {
  atoms: ['packages/ui/src/components/atoms/**'],
  molecules: ['packages/ui/src/components/molecules/**'],
  organisms: ['packages/ui/src/components/organisms/**'],
  'cms-blocks': ['packages/ui/src/components/cms/blocks/**'],
  templates: ['packages/ui/src/components/templates/**'],
  layout: ['packages/ui/src/components/layout/**'],
  other: ['packages/ui/src/components/**'],
};

export const bucketPolicy: Record<Bucket, BucketPolicy> = {
  atoms: { requireDefault: true, requireLoading: false, requireEmpty: false, requireError: false, requireRTL: false },
  molecules: { requireDefault: true, requireLoading: false, requireEmpty: false, requireError: false, requireRTL: false },
  organisms: { requireDefault: true, requireLoading: true, requireEmpty: true, requireError: true, requireRTL: true, requireMobile: true },
  'cms-blocks': { requireDefault: true, requireLoading: true, requireEmpty: true, requireError: true, requireRTL: true },
  templates: { requireDefault: true, requireLoading: true, requireEmpty: true, requireError: true, requireRTL: true },
  layout: { requireDefault: true, requireLoading: false, requireEmpty: false, requireError: false, requireRTL: false },
  other: { requireDefault: true, requireLoading: false, requireEmpty: false, requireError: false, requireRTL: false },
};

// Allowlist: story files that do not need full matrix per policy
export const allowlist: string[] = [
  'packages/ui/src/components/cms/blocks/data/DataContext.tsx',
];
