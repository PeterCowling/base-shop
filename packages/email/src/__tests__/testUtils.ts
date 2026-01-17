import { setCampaignStore } from "../storage";
import type { CampaignStore, Campaign } from "../storage";

jest.mock("@acme/platform-core/repositories/analytics.server", () => ({
  listEvents: jest.fn(),
}));

jest.mock("../send", () => ({
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../hooks", () => ({
  emitSend: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../analytics", () => ({
  syncCampaignAnalytics: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../segments", () => ({
  resolveSegment: jest.fn(),
}));

jest.mock("../templates", () => ({
  renderTemplate: jest.fn(),
}));

jest.mock("@acme/lib", () => ({
  validateShopName: jest.fn((s: string) => s),
}));

export { listEvents } from "@acme/platform-core/repositories/analytics.server";
export { sendCampaignEmail } from "../send";
export { emitSend } from "../hooks";
export { syncCampaignAnalytics as fetchCampaignAnalytics } from "../analytics";
export { resolveSegment } from "../segments";
export { renderTemplate } from "../templates";
export { validateShopName } from "@acme/lib";

export const shop = "test-shop";

export function setupTest() {
  jest.clearAllMocks();
  jest.useFakeTimers();
  const memory: Record<string, Campaign[]> = {};
  const readCampaigns = jest.fn(async (s: string) => memory[s] || []);
  const writeCampaigns = jest.fn(async (s: string, items: Campaign[]) => {
    memory[s] = items;
  });
  const listShops = jest.fn(async () => Object.keys(memory));
  const store: CampaignStore = { readCampaigns, writeCampaigns, listShops };
  setCampaignStore(store);
  const now = new Date("2020-01-01T00:00:00Z");
  jest.setSystemTime(now);
  const scheduler = require("../scheduler");
  scheduler.setClock({ now: () => new Date() });
  (require("@acme/platform-core/repositories/analytics.server").listEvents as jest.Mock).mockResolvedValue([]);
  return { memory, readCampaigns, writeCampaigns, listShops, now };
}

export function teardown() {
  jest.useRealTimers();
  delete process.env.NEXT_PUBLIC_BASE_URL;
  delete process.env.EMAIL_BATCH_SIZE;
  delete process.env.EMAIL_BATCH_DELAY_MS;
}
