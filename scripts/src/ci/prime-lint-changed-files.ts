import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PRIME_PATH_PREFIX = 'apps/prime/';

const LINTABLE_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
]);

type CliFormat = 'json' | 'outputs';

type SkipReason = 'none' | 'no_paths' | 'no_prime_paths' | 'no_lintable_paths';

export interface PrimeLintDecision {
  shouldRun: boolean;
  targets: string[];
  skippedReason: SkipReason;
  totalInputPaths: number;
}

export function normalizePath(rawPath: string): string {
  return rawPath.trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

function extensionOf(path: string): string {
  const idx = path.lastIndexOf('.');
  return idx >= 0 ? path.slice(idx) : '';
}

export function isPrimePath(path: string): boolean {
  return normalizePath(path).startsWith(PRIME_PATH_PREFIX);
}

export function isLintablePrimePath(path: string): boolean {
  const normalized = normalizePath(path);
  if (!normalized.startsWith(PRIME_PATH_PREFIX)) {
    return false;
  }

  return LINTABLE_EXTENSIONS.has(extensionOf(normalized));
}

export function collectPrimeLintTargets(paths: readonly string[]): string[] {
  const unique = new Set<string>();

  for (const path of paths) {
    const normalized = normalizePath(path);
    if (!normalized) continue;
    if (!isLintablePrimePath(normalized)) continue;
    unique.add(normalized);
  }

  return Array.from(unique).sort();
}

export function buildPrimeLintDecision(paths: readonly string[]): PrimeLintDecision {
  const normalizedPaths = paths.map(normalizePath).filter(Boolean);

  if (normalizedPaths.length === 0) {
    return {
      shouldRun: false,
      targets: [],
      skippedReason: 'no_paths',
      totalInputPaths: 0,
    };
  }

  const hasPrimePath = normalizedPaths.some((path) => isPrimePath(path));
  if (!hasPrimePath) {
    return {
      shouldRun: false,
      targets: [],
      skippedReason: 'no_prime_paths',
      totalInputPaths: normalizedPaths.length,
    };
  }

  const targets = collectPrimeLintTargets(normalizedPaths);
  if (targets.length === 0) {
    return {
      shouldRun: false,
      targets: [],
      skippedReason: 'no_lintable_paths',
      totalInputPaths: normalizedPaths.length,
    };
  }

  return {
    shouldRun: true,
    targets,
    skippedReason: 'none',
    totalInputPaths: normalizedPaths.length,
  };
}

type ParsedArgs = {
  paths: string[];
  format: CliFormat;
  runEslint: boolean;
  baseSha: string | null;
  headSha: string;
};

function parseArgs(argv: string[]): ParsedArgs {
  const paths: string[] = [];
  let format: CliFormat = 'json';
  let runEslint = false;
  let baseSha: string | null = null;
  let headSha = 'HEAD';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;

    if (arg === '--path') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --path');
      }
      paths.push(next);
      index += 1;
      continue;
    }

    if (arg === '--paths-file') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --paths-file');
      }
      const filePaths = readFileSync(next, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      paths.push(...filePaths);
      index += 1;
      continue;
    }

    if (arg === '--format') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --format');
      }
      if (next !== 'json' && next !== 'outputs') {
        throw new Error(`Invalid --format value: ${next}`);
      }
      format = next;
      index += 1;
      continue;
    }

    if (arg === '--run-eslint') {
      runEslint = true;
      continue;
    }

    if (arg === '--base') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --base');
      }
      baseSha = next;
      index += 1;
      continue;
    }

    if (arg === '--head') {
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        throw new Error('Missing value for --head');
      }
      headSha = next;
      index += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(`Usage:
  pnpm exec tsx scripts/src/ci/prime-lint-changed-files.ts --path <path> [--path <path>]
  pnpm exec tsx scripts/src/ci/prime-lint-changed-files.ts --paths-file <file>
  pnpm exec tsx scripts/src/ci/prime-lint-changed-files.ts --base <sha> [--head <sha>] [--run-eslint]
  pnpm exec tsx scripts/src/ci/prime-lint-changed-files.ts [--run-eslint]  # uses git diff HEAD
`);
      process.exit(0);
    }

    paths.push(arg);
  }

  return { paths, format, runEslint, baseSha, headSha };
}

function parseGitDiffOutput(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readChangedPathsFromGit(baseSha: string | null, headSha: string): string[] {
  const args = ['diff', '--name-only', '--diff-filter=ACMRTUXB'];

  if (baseSha) {
    args.push(baseSha, headSha);
  } else {
    args.push('HEAD');
  }

  const output = execFileSync('git', args, { encoding: 'utf8' });
  return parseGitDiffOutput(output);
}

function printDecisionOutputs(decision: PrimeLintDecision): void {
  console.log(`run_lint=${decision.shouldRun}`);
  console.log(`lint_target_count=${decision.targets.length}`);
  console.log(`total_input_paths=${decision.totalInputPaths}`);
  console.log(`skipped_reason=${decision.skippedReason}`);
}

function runEslintForTargets(targets: string[]): number {
  if (targets.length === 0) {
    return 0;
  }

  const result = spawnSync(
    'pnpm',
    ['exec', 'eslint', '--max-warnings=0', ...targets],
    {
      stdio: 'inherit',
    },
  );

  return result.status ?? 1;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  const inputPaths =
    args.paths.length > 0 ? args.paths : readChangedPathsFromGit(args.baseSha, args.headSha);

  const decision = buildPrimeLintDecision(inputPaths);

  if (args.format === 'outputs') {
    printDecisionOutputs(decision);
  } else {
    console.log(JSON.stringify(decision, null, 2));
  }

  if (!args.runEslint) {
    return;
  }

  if (!decision.shouldRun) {
    return;
  }

  const status = runEslintForTargets(decision.targets);
  if (status !== 0) {
    process.exitCode = status;
  }
}

if (process.argv[1]?.includes('prime-lint-changed-files')) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[prime-lint-changed-files] ${message}`);
    process.exitCode = 1;
  }
}
