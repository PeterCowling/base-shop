import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import { bucketGlobs, bucketPolicy, type Bucket, allowlist } from './coverage.config';

interface ComponentRecord {
  componentPath: string;
  storiesPath?: string;
  bucket: Bucket;
  hasDefault: boolean;
  hasLoading: boolean;
  hasEmpty: boolean;
  hasError: boolean;
  hasRTL: boolean;
  complete: boolean;
}

function detectBucket(file: string): Bucket {
  const p = file.replace(/\\/g, '/');
  if (bucketGlobs.atoms.some((g) => p.includes('/components/atoms/'))) return 'atoms';
  if (bucketGlobs.molecules.some((g) => p.includes('/components/molecules/'))) return 'molecules';
  if (bucketGlobs.organisms.some((g) => p.includes('/components/organisms/'))) return 'organisms';
  if (bucketGlobs['cms-blocks'].some((g) => p.includes('/components/cms/blocks/'))) return 'cms-blocks';
  if (bucketGlobs.templates.some((g) => p.includes('/components/templates/'))) return 'templates';
  if (bucketGlobs.layout.some((g) => p.includes('/components/layout/'))) return 'layout';
  return 'other';
}

function read(file: string): string {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

function hasExport(src: string, name: string): boolean {
  const re = new RegExp(`export\\s+const\\s+${name}\\b`);
  return re.test(src);
}

function hasRTLHint(src: string): boolean {
  // Prefer explicit RTL export or a parameters.rtl flag in any export
  if (hasExport(src, 'RTL')) return true;
  if (/parameters\s*:\s*\{[^}]*\brtl\s*:\s*true/m.test(src)) return true;
  return false;
}

(async () => {
  const ROOT = path.resolve(process.cwd(), 'packages/ui/src/components');
  const componentFiles = await fg('**/*.tsx', {
    cwd: ROOT,
    ignore: ['**/*.stories.tsx', '**/*.stories.ts', '**/*.Matrix.stories.tsx', '**/__tests__/**'],
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
    const storyFile = stories[0];
    const src = storyFile ? read(storyFile) : '';
    const bucket = detectBucket(c);
    const policy = bucketPolicy[bucket];

    const hasDefault = hasExport(src, 'Default');
    const hasLoading = hasExport(src, 'Loading');
    const hasEmpty = hasExport(src, 'Empty');
    const hasError = hasExport(src, 'Error');
    const hasRTL = hasRTLHint(src);

    // Determine completeness under policy
    const needDefault = policy.requireDefault;
    const needLoading = policy.requireLoading;
    const needEmpty = policy.requireEmpty;
    const needError = policy.requireError;
    const needRTL = policy.requireRTL;

    const fileKey = storyFile ? path.relative(process.cwd(), storyFile) : '';
    const isAllowed = storyFile && allowlist.some((a) => fileKey.endsWith(a));

    const complete = !!storyFile && (
      isAllowed || (
        (!needDefault || hasDefault) &&
        (!needLoading || hasLoading) &&
        (!needEmpty || hasEmpty) &&
        (!needError || hasError) &&
        (!needRTL || hasRTL)
      )
    );

    results.push({
      componentPath: c,
      storiesPath: storyFile,
      bucket,
      hasDefault,
      hasLoading,
      hasEmpty,
      hasError,
      hasRTL,
      complete,
    });
  }

  const byBucket: Record<Bucket, ComponentRecord[]> = {
    atoms: [], molecules: [], organisms: [], 'cms-blocks': [], templates: [], layout: [], other: [],
  };
  results.forEach((r) => byBucket[r.bucket].push(r));

  let missing = 0;
  results.forEach((r) => { if (!r.complete) missing += 1; });

  const report = {
    totalComponents: results.length,
    missingOrIncomplete: missing,
    buckets: Object.fromEntries(
      (Object.keys(byBucket) as Bucket[]).map((k) => {
        const arr = byBucket[k];
        return [k, {
          count: arr.length,
          complete: arr.filter((r) => r.complete).length,
          needsStories: arr.filter((r) => !r.storiesPath).map((r) => r.componentPath),
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

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Components: ${report.totalComponents}`);
    console.log(`Missing/incomplete: ${report.missingOrIncomplete}`);
    for (const [k, v] of Object.entries(report.buckets)) {
      const vb: any = v as any;
      console.log(
        `${k.padEnd(12)} | total: ${String(vb.count).padStart(3)} | complete: ${String(vb.complete).padStart(3)} | needs stories: ${vb.needsStories.length} | needs states: ${vb.needsStates.length}`
      );
    }
    if (missing > 0) process.exitCode = 1;
  }
})();

