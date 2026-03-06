import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getRoomSlug } from "@acme/ui/config/roomSlugs";

import { GUIDES_INDEX } from "@/data/guides.index";
import { websiteVisibleRoomsData } from "@/data/roomsData";
import { type AppLanguage, i18nConfig } from "@/i18n.config";
import { guidePath, guideSlug } from "@/routes.guides-helpers";
import { INTERNAL_SEGMENT_BY_KEY, TOP_LEVEL_SEGMENT_KEYS } from "@/routing/sectionSegments";
import { SLUGS } from "@/slug-map";
import { getSlug } from "@/utils/slug";

type Category = "top-level" | "nested-segment" | "special-route" | "room" | "guide";

type MatchRecord = {
  category: Category;
  englishSlug: string;
  key: string;
  lang: AppLanguage;
  path: string;
  slug: string;
};

type AuditResult = {
  approved: MatchRecord[];
  unexpected: MatchRecord[];
};

const NON_DORM_ROOM_IDS = new Set(["double_room", "apartment"]);
const APPROVED_SHARED_SLUGS = {
  guide: new Set<string>(),
  "nested-segment": new Set<string>(),
  room: new Set<string>(),
  "special-route": new Set<string>(),
  "top-level": new Set<string>(["fr:experiences:experiences", "fr:guides:guides"]),
} as const satisfies Record<Category, ReadonlySet<string>>;

const ROUTE_FAMILY_PATTERNS = [
  "`/{lang}`",
  "`/{lang}/{topLevelSlug}`",
  "`/{lang}/{privateBookingSlug}`",
  "`/{lang}/{roomsSlug}/{roomSlug}`",
  "`/{lang}/{guideNamespaceSlug}/{guideSlug}`",
  "`/{lang}/{experiencesSlug}/{guidesTagsSlug}/{tag}`",
] as const;

function resolveAppRoot(): string {
  const cwd = process.cwd();
  const appMarker = path.join(cwd, "src", "i18n.config.ts");
  if (existsSync(appMarker)) return cwd;

  const repoCandidate = path.join(cwd, "apps", "brikette");
  const repoMarker = path.join(repoCandidate, "src", "i18n.config.ts");
  if (existsSync(repoMarker)) return repoCandidate;

  return cwd;
}

const APP_ROOT = resolveAppRoot();
const REPO_ROOT = path.resolve(APP_ROOT, "../..");
const ARTIFACT_PATH = path.join(
  REPO_ROOT,
  "docs",
  "plans",
  "brikette-sales-funnel-analysis",
  "artifacts",
  "route-localization-contract.md",
);

function sortMatches(matches: readonly MatchRecord[]): MatchRecord[] {
  return [...matches].sort((left, right) => {
    const langCompare = left.lang.localeCompare(right.lang);
    if (langCompare !== 0) return langCompare;

    const categoryCompare = left.category.localeCompare(right.category);
    if (categoryCompare !== 0) return categoryCompare;

    const keyCompare = left.key.localeCompare(right.key);
    if (keyCompare !== 0) return keyCompare;

    return left.slug.localeCompare(right.slug);
  });
}

function auditMatch(match: MatchRecord): AuditResult {
  const allowlistKey = `${match.lang}:${match.key}:${match.slug}`;
  const allowlist = APPROVED_SHARED_SLUGS[match.category];
  if (allowlist.has(allowlistKey)) {
    return { approved: [match], unexpected: [] };
  }

  return { approved: [], unexpected: [match] };
}

function mergeAuditResults(results: readonly AuditResult[]): AuditResult {
  return {
    approved: sortMatches(results.flatMap((result) => result.approved)),
    unexpected: sortMatches(results.flatMap((result) => result.unexpected)),
  };
}

function auditTopLevelSlugs(langs: readonly AppLanguage[]): AuditResult {
  const results: AuditResult[] = [];

  for (const lang of langs) {
    if (lang === "en") continue;

    for (const key of TOP_LEVEL_SEGMENT_KEYS) {
      const englishSlug = SLUGS[key].en;
      const internalEnglishSlug = INTERNAL_SEGMENT_BY_KEY[key];
      const slug = SLUGS[key][lang];
      if (slug !== englishSlug && slug !== internalEnglishSlug) continue;

      results.push(
        auditMatch({
          category: "top-level",
          englishSlug: slug === internalEnglishSlug ? internalEnglishSlug : englishSlug,
          key,
          lang,
          path: `/${lang}/${slug}`,
          slug,
        }),
      );
    }
  }

  return mergeAuditResults(results);
}

function auditNestedRouteSegments(langs: readonly AppLanguage[]): AuditResult {
  const results: AuditResult[] = [];

  for (const lang of langs) {
    if (lang === "en") continue;

    const englishSlug = SLUGS.guidesTags.en;
    const slug = SLUGS.guidesTags[lang];
    if (slug !== englishSlug) continue;

    results.push(
      auditMatch({
        category: "nested-segment",
        englishSlug,
        key: "guidesTags",
        lang,
        path: `/${lang}/${getSlug("experiences", lang)}/${slug}/:tag`,
        slug,
      }),
    );
  }

  return mergeAuditResults(results);
}

function auditSpecialRoutes(langs: readonly AppLanguage[]): AuditResult {
  const results: AuditResult[] = [];

  for (const lang of langs) {
    if (lang === "en") continue;
    const englishSlug = SLUGS.privateBooking.en;
    const slug = SLUGS.privateBooking[lang];
    if (slug !== englishSlug) continue;

    results.push(
      auditMatch({
        category: "special-route",
        englishSlug,
        key: "privateBooking",
        lang,
        path: `/${lang}/${slug}`,
        slug,
      }),
    );
  }

  return mergeAuditResults(results);
}

function auditRoomSlugs(langs: readonly AppLanguage[]): AuditResult {
  const results: AuditResult[] = [];
  const roomIds = websiteVisibleRoomsData
    .filter((room) => !NON_DORM_ROOM_IDS.has(room.id))
    .map((room) => room.id);

  for (const lang of langs) {
    if (lang === "en") continue;

    for (const roomId of roomIds) {
      const englishSlug = getRoomSlug(roomId, "en");
      const slug = getRoomSlug(roomId, lang);
      if (slug !== englishSlug) continue;

      results.push(
        auditMatch({
          category: "room",
          englishSlug,
          key: roomId,
          lang,
          path: `/${lang}/${getSlug("rooms", lang)}/${slug}`,
          slug,
        }),
      );
    }
  }

  return mergeAuditResults(results);
}

function auditGuideSlugs(langs: readonly AppLanguage[]): AuditResult {
  const results: AuditResult[] = [];
  const liveGuides = GUIDES_INDEX.filter((guide) => guide.status === "live");

  for (const lang of langs) {
    if (lang === "en") continue;

    for (const guide of liveGuides) {
      const englishSlug = guideSlug("en", guide.key);
      const slug = guideSlug(lang, guide.key);
      if (slug !== englishSlug) continue;

      results.push(
        auditMatch({
          category: "guide",
          englishSlug,
          key: guide.key,
          lang,
          path: guidePath(lang, guide.key),
          slug,
        }),
      );
    }
  }

  return mergeAuditResults(results);
}

function buildTopLevelMatrix(langs: readonly AppLanguage[]): string {
  return langs
    .map((lang) => {
      const entries = TOP_LEVEL_SEGMENT_KEYS.map((key) => `${key}: ${SLUGS[key][lang]}`);
      return `- \`${lang}\`: ${entries.join(", ")}`;
    })
    .join("\n");
}

function formatMatchList(matches: readonly MatchRecord[]): string {
  if (matches.length === 0) return "- None";

  return matches
    .map(
      (match) =>
        `- \`${match.lang}\` \`${match.key}\` -> \`${match.slug}\` (${match.path})`,
    )
    .join("\n");
}

function formatGroupedMatchList(matches: readonly MatchRecord[]): string {
  if (matches.length === 0) return "- None";

  const groups = new Map<AppLanguage, MatchRecord[]>();
  for (const match of matches) {
    const existing = groups.get(match.lang) ?? [];
    existing.push(match);
    groups.set(match.lang, existing);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([lang, langMatches]) => {
      const items = langMatches
        .map((match) => `  - \`${match.key}\` -> \`${match.slug}\` (${match.path})`)
        .join("\n");
      return `- \`${lang}\` (${langMatches.length})\n${items}`;
    })
    .join("\n");
}

function buildArtifactMarkdown(input: {
  guideAudit: AuditResult;
  langs: readonly AppLanguage[];
  nestedAudit: AuditResult;
  roomAudit: AuditResult;
  specialAudit: AuditResult;
  topLevelAudit: AuditResult;
}): string {
  const { guideAudit, langs, nestedAudit, roomAudit, specialAudit, topLevelAudit } = input;
  const generatedAt = new Date().toISOString();
  const totalUnexpected =
    topLevelAudit.unexpected.length +
    nestedAudit.unexpected.length +
    specialAudit.unexpected.length +
    roomAudit.unexpected.length +
    guideAudit.unexpected.length;

  return `# Route Localization Contract

- Generated: \`${generatedAt}\`
- Supported locales: \`${langs.length}\`
- Public route families audited: \`${ROUTE_FAMILY_PATTERNS.length}\`
- Unexpected English-slug matches outside allowlist: \`${totalUnexpected}\`

## Sources
- \`apps/brikette/src/slug-map.ts\`
- \`apps/brikette/src/routing/sectionSegments.ts\`
- \`apps/brikette/src/routing/routeInventory.ts\`
- \`apps/brikette/src/middleware.ts\`
- \`packages/ui/src/config/roomSlugs.ts\`
- \`apps/brikette/src/guides/slugs/slugs.ts\`
- \`apps/brikette/src/data/guides.index.ts\`

## Public Route Families
${ROUTE_FAMILY_PATTERNS.map((pattern) => `- ${pattern}`).join("\n")}

## Approved Shared-Spelling Allowlist
${formatMatchList([
  ...topLevelAudit.approved,
  ...nestedAudit.approved,
  ...specialAudit.approved,
  ...roomAudit.approved,
  ...guideAudit.approved,
])}

## Top-Level Route Slug Matrix
${buildTopLevelMatrix(langs)}

## Unexpected Top-Level English Matches
${formatMatchList(topLevelAudit.unexpected)}

## Unexpected Nested Route-Segment English Matches
${formatMatchList(nestedAudit.unexpected)}

## Unexpected Special-Route English Matches
${formatMatchList(specialAudit.unexpected)}

## Unexpected Room Slug English Matches
${formatGroupedMatchList(roomAudit.unexpected)}

## Unexpected Guide Slug English Matches
${formatGroupedMatchList(guideAudit.unexpected)}
`;
}

async function main(): Promise<void> {
  const langs = i18nConfig.supportedLngs as AppLanguage[];
  const topLevelAudit = auditTopLevelSlugs(langs);
  const nestedAudit = auditNestedRouteSegments(langs);
  const specialAudit = auditSpecialRoutes(langs);
  const roomAudit = auditRoomSlugs(langs);
  const guideAudit = auditGuideSlugs(langs);

  const totalUnexpected =
    topLevelAudit.unexpected.length +
    nestedAudit.unexpected.length +
    specialAudit.unexpected.length +
    roomAudit.unexpected.length +
    guideAudit.unexpected.length;

  const markdown = buildArtifactMarkdown({
    guideAudit,
    langs,
    nestedAudit,
    roomAudit,
    specialAudit,
    topLevelAudit,
  });

  await mkdir(path.dirname(ARTIFACT_PATH), { recursive: true });
  await writeFile(ARTIFACT_PATH, markdown, "utf8");

  console.info("Route localization audit");
  console.info(`  Artifact: ${ARTIFACT_PATH}`);
  console.info(`  Approved shared spellings: ${topLevelAudit.approved.length + nestedAudit.approved.length + specialAudit.approved.length + roomAudit.approved.length + guideAudit.approved.length}`);
  console.info(`  Unexpected top-level matches: ${topLevelAudit.unexpected.length}`);
  console.info(`  Unexpected nested-segment matches: ${nestedAudit.unexpected.length}`);
  console.info(`  Unexpected special-route matches: ${specialAudit.unexpected.length}`);
  console.info(`  Unexpected room matches: ${roomAudit.unexpected.length}`);
  console.info(`  Unexpected guide matches: ${guideAudit.unexpected.length}`);

  if (totalUnexpected > 0) {
    console.error("\nUnexpected English-slug matches detected outside the explicit allowlist.");
    process.exitCode = 1;
    return;
  }

  console.info("\n✓ Route localization audit passed");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
