import { auditGuideSeo, saveAuditResults, formatAuditSummary } from '../src/lib/seo-audit/index';
import type { GuideKey } from '../src/guides/slugs/keys';

const guideKey = process.argv[2] as GuideKey;
if (!guideKey) {
  console.error('Usage: tsx run-audit-cli.ts <guideKey>');
  process.exit(1);
}

async function main() {
  console.log(`Auditing guide: ${guideKey}`);
  
  const results = await auditGuideSeo(guideKey, 'en');
  await saveAuditResults(guideKey, results);
  
  const summary = formatAuditSummary(guideKey, results);
  console.log(summary);
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
