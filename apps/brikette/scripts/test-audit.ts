/**
 * Quick test of the audit function on positanoBeaches guide
 */
import { auditGuideSeo, formatAuditSummary, saveAuditResults } from "../src/lib/seo-audit";

async function main() {
  try {
    console.log("Running SEO audit on positanoBeaches guide...\n");
    
    const results = await auditGuideSeo("positanoBeaches", "en");
    
    console.log(formatAuditSummary("positanoBeaches", results));
    
    console.log("\nMetrics:");
    console.log(JSON.stringify(results.metrics, null, 2));
    
    // Optionally save results
    // await saveAuditResults("positanoBeaches", results);
    // console.log("\nResults saved to guide-manifest-overrides.json");
    
  } catch (err) {
    console.error("Error:", (err as Error).message);
    process.exit(1);
  }
}

main();
