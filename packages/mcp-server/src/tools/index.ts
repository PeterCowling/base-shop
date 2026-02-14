import { errorResult } from "../utils/validation.js";

import { analyticsTools, handleAnalyticsTool } from "./analytics.js";
import { preflightAnalyticsSunsetGate } from "./analytics-sunset.js";
import { bookingEmailTools, handleBookingEmailTool } from "./booking-email.js";
import { bosToolPoliciesRaw, bosTools, handleBosTool } from "./bos.js";
import { discountTools, handleDiscountTool } from "./discounts.js";
import { draftGenerateTools, handleDraftGenerateTool } from "./draft-generate.js";
import { draftInterpretTools, handleDraftInterpretTool } from "./draft-interpret.js";
import { draftQualityTools, handleDraftQualityTool } from "./draft-quality-check.js";
import { gmailTools, handleGmailTool } from "./gmail.js";
import { handleHealthTool,healthTools } from "./health.js";
import { handleInventoryTool,inventoryTools } from "./inventory.js";
import { handleLoopTool, loopToolPoliciesRaw, loopTools } from "./loop.js";
import { handleOctorateTool, octorateTools } from "./octorate.js";
import { handleOrderTool,orderTools } from "./orders.js";
import { handleOutboundDraftTool, outboundDraftTools } from "./outbound-drafts.js";
import { handlePageTool,pageTools } from "./pages.js";
import { parsePolicyMap, preflightToolCallPolicy } from "./policy.js";
import { handleProductTool,productTools } from "./products.js";
import { handleSectionTool,sectionTools } from "./sections.js";
import { handleSeoTool,seoTools } from "./seo.js";
import { handleSettingsTool,settingsTools } from "./settings.js";
import { handleShopTool,shopTools } from "./shops.js";
import { handleThemeTool,themeTools } from "./themes.js";

export const toolDefinitions = [
  ...shopTools,
  ...orderTools,
  ...inventoryTools,
  ...pageTools,
  ...sectionTools,
  ...settingsTools,
  ...productTools,
  ...analyticsTools,
  ...healthTools,
  ...seoTools,
  ...discountTools,
  ...themeTools,
  ...bosTools,
  ...loopTools,
  ...gmailTools,
  ...octorateTools,
  ...bookingEmailTools,
  ...draftInterpretTools,
  ...draftGenerateTools,
  ...draftQualityTools,
  ...outboundDraftTools,
];

const knownToolNames = new Set(toolDefinitions.map((tool) => tool.name));

// Strict metadata enforcement is scoped to startup-loop tools in phase 1 (`bos_*`, `loop_*`).
// Existing legacy tools run through compatibility mode until a dedicated annotation wave.
const toolPolicyMap = parsePolicyMap({
  ...bosToolPoliciesRaw,
  ...loopToolPoliciesRaw,
});

const shopToolNames = new Set(shopTools.map((t) => t.name));
const orderToolNames = new Set(orderTools.map((t) => t.name));
const inventoryToolNames = new Set(inventoryTools.map((t) => t.name));
const pageToolNames = new Set(pageTools.map((t) => t.name));
const sectionToolNames = new Set(sectionTools.map((t) => t.name));
const settingsToolNames = new Set(settingsTools.map((t) => t.name));
const productToolNames = new Set(productTools.map((t) => t.name));
const analyticsToolNames = new Set(analyticsTools.map((t) => t.name));
const healthToolNames = new Set(healthTools.map((t) => t.name));
const seoToolNames = new Set(seoTools.map((t) => t.name));
const discountToolNames = new Set(discountTools.map((t) => t.name));
const themeToolNames = new Set(themeTools.map((t) => t.name));
const bosToolNames = new Set(bosTools.map((t) => t.name));
const loopToolNames = new Set(loopTools.map((t) => t.name));
const gmailToolNames = new Set(gmailTools.map((t) => t.name));
const octorateToolNames = new Set(octorateTools.map((t) => t.name));
const bookingEmailToolNames = new Set(bookingEmailTools.map((t) => t.name));
const draftInterpretToolNames = new Set(draftInterpretTools.map((t) => t.name));
const draftGenerateToolNames = new Set(draftGenerateTools.map((t) => t.name));
const draftQualityToolNames = new Set(draftQualityTools.map((t) => t.name));
const outboundDraftToolNames = new Set(outboundDraftTools.map((t) => t.name));

export async function handleToolCall(name: string, args: unknown) {
  const analyticsSunsetError = await preflightAnalyticsSunsetGate(name, args);
  if (analyticsSunsetError) {
    return analyticsSunsetError;
  }

  const preflightError = preflightToolCallPolicy({
    toolName: name,
    args,
    knownToolNames,
    policyMap: toolPolicyMap,
  });

  if (preflightError) {
    return preflightError;
  }

  if (shopToolNames.has(name as never)) {
    return handleShopTool(name, args);
  }
  if (orderToolNames.has(name as never)) {
    return handleOrderTool(name, args);
  }
  if (inventoryToolNames.has(name as never)) {
    return handleInventoryTool(name, args);
  }
  if (pageToolNames.has(name as never)) {
    return handlePageTool(name, args);
  }
  if (sectionToolNames.has(name as never)) {
    return handleSectionTool(name, args);
  }
  if (settingsToolNames.has(name as never)) {
    return handleSettingsTool(name, args);
  }
  if (productToolNames.has(name as never)) {
    return handleProductTool(name, args);
  }
  if (analyticsToolNames.has(name as never)) {
    return handleAnalyticsTool(name, args);
  }
  if (healthToolNames.has(name as never)) {
    return handleHealthTool(name, args);
  }
  if (seoToolNames.has(name as never)) {
    return handleSeoTool(name, args);
  }
  if (discountToolNames.has(name as never)) {
    return handleDiscountTool(name, args);
  }
  if (themeToolNames.has(name as never)) {
    return handleThemeTool(name, args);
  }
  if (bosToolNames.has(name as never)) {
    return handleBosTool(name, args);
  }
  if (loopToolNames.has(name as never)) {
    return handleLoopTool(name, args);
  }
  if (gmailToolNames.has(name as never)) {
    return handleGmailTool(name, args);
  }
  if (octorateToolNames.has(name as never)) {
    return handleOctorateTool(name, args);
  }
  if (bookingEmailToolNames.has(name as never)) {
    return handleBookingEmailTool(name, args);
  }
  if (draftInterpretToolNames.has(name as never)) {
    return handleDraftInterpretTool(name, args);
  }
  if (draftGenerateToolNames.has(name as never)) {
    return handleDraftGenerateTool(name, args);
  }
  if (draftQualityToolNames.has(name as never)) {
    return handleDraftQualityTool(name, args);
  }
  if (outboundDraftToolNames.has(name as never)) {
    return handleOutboundDraftTool(name, args);
  }
  return errorResult(`Unknown tool: ${name}`);
}
