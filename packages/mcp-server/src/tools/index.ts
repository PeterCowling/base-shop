import { errorResult } from "../utils/validation.js";

import { analyticsTools, handleAnalyticsTool } from "./analytics.js";
import { bookingEmailTools, handleBookingEmailTool } from "./booking-email.js";
import { discountTools, handleDiscountTool } from "./discounts.js";
import { draftGenerateTools, handleDraftGenerateTool } from "./draft-generate.js";
import { draftInterpretTools, handleDraftInterpretTool } from "./draft-interpret.js";
import { draftQualityTools, handleDraftQualityTool } from "./draft-quality-check.js";
import { gmailTools, handleGmailTool } from "./gmail.js";
import { handleHealthTool,healthTools } from "./health.js";
import { handleInventoryTool,inventoryTools } from "./inventory.js";
import { handleOrderTool,orderTools } from "./orders.js";
import { handlePageTool,pageTools } from "./pages.js";
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
  ...gmailTools,
  ...bookingEmailTools,
  ...draftInterpretTools,
  ...draftGenerateTools,
  ...draftQualityTools,
];

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
const gmailToolNames = new Set(gmailTools.map((t) => t.name));
const bookingEmailToolNames = new Set(bookingEmailTools.map((t) => t.name));
const draftInterpretToolNames = new Set(draftInterpretTools.map((t) => t.name));
const draftGenerateToolNames = new Set(draftGenerateTools.map((t) => t.name));
const draftQualityToolNames = new Set(draftQualityTools.map((t) => t.name));

export async function handleToolCall(name: string, args: unknown) {
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
  if (gmailToolNames.has(name as never)) {
    return handleGmailTool(name, args);
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
  return errorResult(`Unknown tool: ${name}`);
}
