import type { SeoAuditEntry } from "../src/repositories/seoAudit.server";

describe("seoAudit repo", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("delegates read and append to the resolved repository", async () => {
    const readSpy = jest.fn<Promise<SeoAuditEntry[]>, [string]>().mockResolvedValue([
      { timestamp: "1", score: 50 },
    ]);
    const appendSpy = jest.fn<Promise<void>, [string, SeoAuditEntry]>().mockResolvedValue();

    const resolveRepoMock = jest.fn().mockResolvedValue({
      readSeoAudits: readSpy,
      appendSeoAudit: appendSpy,
    });

    jest.doMock("../src/repositories/repoResolver", () => ({
      resolveRepo: resolveRepoMock,
    }));

    const { readSeoAudits, appendSeoAudit } = await import(
      "../src/repositories/seoAudit.server"
    );

    const shop = "acme";
    const entry: SeoAuditEntry = { timestamp: "now", score: 90 };

    await readSeoAudits(shop);
    await appendSeoAudit(shop, entry);

    expect(readSpy).toHaveBeenCalledWith(shop);
    expect(appendSpy).toHaveBeenCalledWith(shop, entry);
    expect(resolveRepoMock).toHaveBeenCalledTimes(1);
  });

  it("caches the repo between calls", async () => {
    const readSpy = jest.fn<Promise<SeoAuditEntry[]>, [string]>().mockResolvedValue([]);
    const appendSpy = jest.fn<Promise<void>, [string, SeoAuditEntry]>().mockResolvedValue();

    const resolveRepoMock = jest.fn().mockResolvedValue({
      readSeoAudits: readSpy,
      appendSeoAudit: appendSpy,
    });

    jest.doMock("../src/repositories/repoResolver", () => ({
      resolveRepo: resolveRepoMock,
    }));

    const { readSeoAudits, appendSeoAudit } = await import(
      "../src/repositories/seoAudit.server"
    );

    const shop = "acme";
    const entry: SeoAuditEntry = { timestamp: "now", score: 1 };

    await readSeoAudits(shop);
    await appendSeoAudit(shop, entry);
    await readSeoAudits(shop);

    expect(resolveRepoMock).toHaveBeenCalledTimes(1);
    expect(readSpy).toHaveBeenCalledTimes(2);
    expect(appendSpy).toHaveBeenCalledTimes(1);
  });
});
