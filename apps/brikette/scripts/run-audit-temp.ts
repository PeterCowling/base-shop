import { auditGuideSeo, saveAuditResults, formatAuditSummary } from '../src/lib/seo-audit/index';

(async () => {
  const guideKey = process.argv[2] || 'chiesaNuovaDepartures';
  const results = await auditGuideSeo(guideKey as any, 'en');
  await saveAuditResults(guideKey as any, results);
  console.log(formatAuditSummary(guideKey as any, results));
})();
