import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import { bucketGlobs, bucketPolicy, type Bucket, allowlist } from './coverage.config';

interface ComponentRecord {
  componentPath: string;
  storiesPath?: string;
  bucket: Bucket;
  isAllowed: boolean;
  hasDefault: boolean;
  hasLoading: boolean;
  hasEmpty: boolean;
  hasError: boolean;
  hasRTL: boolean;
  hasMobile: boolean;
  complete: boolean;
}

function detectBucket(file: string): Bucket {
  const p = file.replace(/\\/g, '/');
  if (bucketGlobs.atoms.some(() => p.includes('/components/atoms/'))) return 'atoms';
  if (bucketGlobs.molecules.some(() => p.includes('/components/molecules/'))) return 'molecules';
  if (bucketGlobs.organisms.some(() => p.includes('/components/organisms/'))) return 'organisms';
  if (bucketGlobs['cms-blocks'].some(() => p.includes('/components/cms/blocks/'))) return 'cms-blocks';
  if (bucketGlobs.templates.some(() => p.includes('/components/templates/'))) return 'templates';
  if (bucketGlobs.layout.some(() => p.includes('/components/layout/'))) return 'layout';
  return 'other';
}

function read(file: string): string {
  // Restrict reads to files within the repository root
  try {
    const root = path.resolve(process.cwd());
    const resolved = path.resolve(file);
    if (!resolved.startsWith(root + path.sep)) return '';
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DEVEX-2145 path validated within repo root
    return fs.readFileSync(resolved, 'utf8');
  } catch { return ''; }
}

const exportRegexByName: Record<string, RegExp> = {
  Default: /export\s+const\s+Default\b/,
  Loading: /export\s+const\s+Loading\b/,
  Empty: /export\s+const\s+Empty\b/,
  Error: /export\s+const\s+Error\b/,
};

function hasExport(src: string, name: string): boolean {
  const re = exportRegexByName[name];
  return re ? re.test(src) : false;
}

function hasRTLHint(src: string): boolean {
  // Prefer explicit RTL export or a parameters.rtl flag in any export
  if (hasExport(src, 'RTL')) return true;
  if (/parameters\s*:\s*\{[^}]*\brtl\s*:\s*true/m.test(src)) return true;
  return false;
}

function hasMobileViewport(src: string): boolean {
  // Accept either explicit defaultViewport or our helper usage that sets mobile1
  if (/viewport\s*:\s*\{[^}]*defaultViewport\s*:\s*['"]mobile1['"]/m.test(src)) return true;
  if (/viewports\s*:\s*\[[^\]]*['"]mobile1['"][^\]]*\]/m.test(src)) return true;
  return false;
}

(async () => {
  const ROOT = path.resolve(process.cwd(), 'packages/ui/src/components');
  const componentFiles = await fg('**/*.tsx', {
    cwd: ROOT,
    ignore: [
      '**/*.stories.tsx', // i18n-exempt -- DEVEX-2146 [ttl=2099-12-31] non-UI glob pattern
      '**/*.stories.ts', // i18n-exempt -- DEVEX-2146 [ttl=2099-12-31] non-UI glob pattern
      '**/*.Matrix.stories.tsx', // i18n-exempt -- DEVEX-2146 [ttl=2099-12-31] non-UI glob pattern
      '**/__tests__/**', // i18n-exempt -- DEVEX-2146 [ttl=2099-12-31] non-UI glob pattern
    ],
    absolute: true,
  });

  const results: ComponentRecord[] = [];

  for (const c of componentFiles) {
    const dir = path.dirname(c);
    const base = path.basename(c, path.extname(c));
    const stories = await fg([
      `${dir}/${base}.stories.@(ts|tsx)`,
      `${dir}/*.stories.@(ts|tsx)`,
      `${dir}/*.Matrix.stories.@(ts|tsx)`,
    ], { absolute: true });
    // Prefer Matrix story when present
    const matrixFirst = stories.sort((a, b) => {
      const am = /\.Matrix\.stories\./.test(a) ? 0 : 1;
      const bm = /\.Matrix\.stories\./.test(b) ? 0 : 1;
      return am - bm;
    });
    const storyFile = matrixFirst[0];
    const srcs = matrixFirst.map(read);
    const bucket = detectBucket(c);
    const policy = bucketPolicy[bucket];

    const hasDefault = srcs.some((s) => hasExport(s, 'Default'));
    const hasLoading = srcs.some((s) => hasExport(s, 'Loading'));
    const hasEmpty = srcs.some((s) => hasExport(s, 'Empty'));
    const hasError = srcs.some((s) => hasExport(s, 'Error'));
    const hasRTL = srcs.some((s) => hasRTLHint(s));
    const hasMobileAny = srcs.some((s) => hasMobileViewport(s));
    // If there is at least one Matrix story, require mobile to be declared in a Matrix story file
    const hasMatrix = matrixFirst.some((f) => /\.Matrix\.stories\./.test(f));
    const hasMobile = !hasMatrix
      ? hasMobileAny
      : matrixFirst
          .filter((f) => /\.Matrix\.stories\./.test(f))
          .map(read)
          .some((s) => hasMobileViewport(s));

    // Determine completeness under policy
    const needDefault = policy.requireDefault;
    const needLoading = policy.requireLoading;
    const needEmpty = policy.requireEmpty;
    const needError = policy.requireError;
    const needRTL = policy.requireRTL;

    const storyRel = storyFile ? path.relative(process.cwd(), storyFile) : '';
    const compRel = path.relative(process.cwd(), c);
    const isAllowed = allowlist.some((a) => storyRel.endsWith(a) || compRel.endsWith(a));

    // Enforce mobile viewport for organisms only on Matrix suites to limit churn
    const needsMobile = policy.requireMobile === true && hasMatrix;

    const complete = isAllowed || ( !!storyFile && (
        (!needDefault || hasDefault) &&
        (!needLoading || hasLoading) &&
        (!needEmpty || hasEmpty) &&
        (!needError || hasError) &&
        (!needRTL || hasRTL) &&
        (!needsMobile || hasMobile)
      ))
    ;

    results.push({
      componentPath: c,
      storiesPath: storyFile,
      bucket,
      isAllowed,
      hasDefault,
      hasLoading,
      hasEmpty,
      hasError,
      hasRTL,
      hasMobile,
      complete,
    });
  }

  const byBucket: Record<Bucket, ComponentRecord[]> = {
    atoms: [], molecules: [], organisms: [], 'cms-blocks': [], templates: [], layout: [], other: [],
  };
  results.forEach((r) => byBucket[r.bucket].push(r));

  let missing = 0;
  results.forEach((r) => { if (!r.complete && r.bucket !== 'other') missing += 1; });

  const report = {
    totalComponents: results.length,
    missingOrIncomplete: missing,
    buckets: Object.fromEntries(
      (Object.keys(byBucket) as Bucket[]).map((k) => {
        const arr = byBucket[k];
        return [k, {
          count: arr.length,
          complete: arr.filter((r) => r.complete).length,
          needsStories: arr.filter((r) => !r.storiesPath && !r.isAllowed).map((r) => r.componentPath),
          needsStates: arr
            .filter((r) => r.storiesPath && !r.complete)
            .map((r) => ({
              file: r.storiesPath!,
              missing: {
                Default: bucketPolicy[k].requireDefault && !r.hasDefault,
                Loading: bucketPolicy[k].requireLoading && !r.hasLoading,
                Empty: bucketPolicy[k].requireEmpty && !r.hasEmpty,
                Error: bucketPolicy[k].requireError && !r.hasError,
                RTL: bucketPolicy[k].requireRTL && !r.hasRTL,
              },
            })),
        }];
      })
    ),
  } as const;

  interface BucketReport {
    count: number;
    complete: number;
    needsStories: string[];
    needsStates: { file: string; missing: { Default: boolean; Loading: boolean; Empty: boolean; Error: boolean; RTL: boolean } }[];
  }
  const bucketsTyped = report.buckets as unknown as Record<Bucket, BucketReport>;

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Components: ${report.totalComponents}`); // i18n-exempt -- DEVEX-000 [ttl=2099-12-31]
    console.log(`Missing/incomplete: ${report.missingOrIncomplete}`); // i18n-exempt -- DEVEX-000 [ttl=2099-12-31]
    for (const [k, v] of Object.entries(bucketsTyped) as [string, BucketReport][]) {
      console.log(
        `${k.padEnd(12)} | total: ${String(v.count).padStart(3)} | complete: ${String(v.complete).padStart(3)} | needs stories: ${v.needsStories.length} | needs states: ${v.needsStates.length}` // i18n-exempt -- DEVEX-000 [ttl=2099-12-31]
      );
    }
    if (missing > 0) process.exitCode = 1;
  }
})();
